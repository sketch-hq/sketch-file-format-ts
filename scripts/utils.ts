import * as ts from 'typescript'
import { JSONSchema7 } from 'json-schema'
import { pascalize } from 'humps'

/**
 * Recursively transforms JSON Schema to TypeScript AST as a generic type node,
 * e.g. `string`, `number` or a type literal like `{ foo: string }`. This is not
 * a generalised algorithm, and is only tested to work with the Sketch file
 * format schemas.
 */
export const schemaToTypeNode = (schema: JSONSchema7): ts.TypeNode => {
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return ts.createUnionTypeNode(
          schema.enum.map((value) =>
            ts.createLiteralTypeNode(ts.createLiteral(value as string)),
          ),
        )
      } else {
        return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      }
    case 'number':
    case 'integer':
      if (schema.enum) {
        return ts.createUnionTypeNode(
          schema.enum.map((value) =>
            ts.createLiteralTypeNode(ts.createLiteral(value as number)),
          ),
        )
      } else {
        return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      }
    case 'boolean':
      if (schema.enum) {
        return ts.createUnionTypeNode(
          schema.enum.map((value) =>
            ts.createLiteralTypeNode(ts.createLiteral(value as boolean)),
          ),
        )
      } else {
        return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
      }
    case 'null':
      return ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword)
    case 'object':
      if (typeof schema.properties === 'object') {
        const required = schema.required || []
        const additionalProps =
          typeof schema.additionalProperties === 'undefined' ||
          !!schema.additionalProperties
        const elements: ts.TypeElement[] = Object.keys(
          schema.properties,
        ).map((key) =>
          ts.createPropertySignature(
            undefined,
            key.includes('-')
              ? ts.createStringLiteral(key)
              : ts.createIdentifier(key),
            required.includes(key)
              ? undefined
              : ts.createToken(ts.SyntaxKind.QuestionToken),
            schemaToTypeNode(schema.properties![key] as JSONSchema7),
            undefined,
          ),
        )
        if (additionalProps) {
          elements.push(
            ts.createIndexSignature(
              undefined,
              undefined,
              [
                ts.createParameter(
                  undefined,
                  undefined,
                  undefined,
                  ts.createIdentifier('key'),
                  undefined,
                  ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                ),
              ],
              ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            ),
          )
        }
        return ts.createTypeLiteralNode(elements)
      } else if (typeof schema.patternProperties === 'object') {
        return ts.createTypeLiteralNode([
          ts.createIndexSignature(
            undefined,
            undefined,
            [
              ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier('key'),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
              ),
            ],
            ts.createUnionTypeNode(
              Object.keys(schema.patternProperties).map((key) =>
                schemaToTypeNode(schema.patternProperties![key] as JSONSchema7),
              ),
            ),
          ),
        ])
      } else {
        return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      }
    case 'array':
      if (typeof schema.items === 'object' && !Array.isArray(schema.items)) {
        return ts.createArrayTypeNode(schemaToTypeNode(schema.items))
      } else {
        return ts.createTupleTypeNode([])
      }
    default:
      if (schema.const) {
        return ts.createLiteralTypeNode(
          ts.createLiteral(schema.const as string),
        )
      } else if (schema.$ref) {
        return ts.createTypeReferenceNode(
          ts.createIdentifier(
            schema.$ref.replace(/#/, '').replace(/\/definitions\//, ''),
          ),
          undefined,
        )
      } else if (schema.oneOf) {
        return ts.createUnionTypeNode(
          schema.oneOf.map((schema) => schemaToTypeNode(schema as JSONSchema7)),
        )
      } else {
        return ts.createTypeLiteralNode(undefined)
      }
  }
}

/**
 * Transforms a JSON Schema to TypeScript AST, but this time as a top
 * level exported type declaration, i.e. `export type Foo = { }`.
 */
export const schemaToTopLevelDeclaration = (
  schema: JSONSchema7,
): ts.DeclarationStatement => {
  const identifier = (schema.$id || 'Unknown').replace(/#/, '')
  let statement: ts.DeclarationStatement
  // @ts-ignore
  const enumDescriptions: string[] = schema.enumDescriptions
  if (schema.enum && enumDescriptions) {
    statement = ts.createEnumDeclaration(
      undefined,
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.createIdentifier(identifier),
      schema.enum.map((item, index) =>
        ts.createEnumMember(
          ts.createIdentifier(
            pascalize(enumDescriptions[index]).replace(/\W/, ''),
          ),
          ts.createLiteral(item as string),
        ),
      ),
    )
  } else {
    statement = ts.createTypeAliasDeclaration(
      undefined,
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.createIdentifier(identifier),
      undefined,
      schemaToTypeNode(schema),
    )
  }

  if (schema.description) {
    ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.MultiLineCommentTrivia,
      `*\n * ${schema.description}\n `,
      true,
    )
  }
  return statement
}

/**
 * Use the presence of `do_objectID` and `frame` properties as a heuristic to
 * identify a schema that represents a layer.
 */
export const isLayerSchema = (schema: JSONSchema7) => {
  const hasFrame =
    schema.properties && typeof schema.properties.frame === 'object'
  const hasId =
    schema.properties && typeof schema.properties.do_objectID === 'object'
  return hasFrame && hasId
}

/**
 * Use layeriness and the presence of a `layers` array as a heruistic to
 * identify a schema that represents a group.
 */
export const isGroupSchema = (schema: JSONSchema7) => {
  const isLayer = isLayerSchema(schema)
  const hasLayers =
    schema.properties && typeof schema.properties.layers === 'object'
  return isLayer && hasLayers
}

/**
 * Does the schema represent an object/class in the model?
 */
export const isObjectSchema = (schema: JSONSchema7) => {
  return schema.properties && '_class' in schema.properties
}
