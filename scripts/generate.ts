import * as ts from 'typescript'
import { writeFileSync } from 'fs'
import { execSync } from 'child_process'
// @ts-ignore
import schemas119 from '@sketch-hq/sketch-file-format-119'
// @ts-ignore
import schemas120 from '@sketch-hq/sketch-file-format-120'
import schemas121 from '@sketch-hq/sketch-file-format-121'
import { JSONSchema7 } from 'json-schema'
import {
  schemaToTopLevelDeclaration,
  isLayerSchema,
  isGroupSchema,
} from './utils'

type SchemaMap = {
  [key: string]: JSONSchema7
}

const generate = (version: string, schemas: any) => {
  const outFile = `${version}-types.ts`
  const definitions: SchemaMap = {
    ...((schemas.document.definitions as SchemaMap) || {}),
    ...((schemas.fileFormat.definitions as SchemaMap) || {}),
    ...((schemas.meta.definitions as SchemaMap) || {}),
    ...((schemas.user.definitions as SchemaMap) || {}),
  }

  const fileFormat: JSONSchema7 = {
    ...schemas.fileFormat,
    $id: '#FileFormat',
  }

  const document: JSONSchema7 = {
    ...schemas.document,
    $id: '#Document',
  }

  const anyLayer: JSONSchema7 = {
    description: 'Union of all layers',
    $id: '#AnyLayer',
    oneOf: Object.keys(definitions)
      .map(key => definitions[key])
      .filter(schema => isLayerSchema(schema))
      .map(schema => ({
        $ref: schema.$id,
      })),
  }

  const anyGroup: JSONSchema7 = {
    description: 'Union of all group layers',
    $id: '#AnyGroup',
    oneOf: Object.keys(definitions)
      .map(key => definitions[key])
      .filter(schema => isGroupSchema(schema))
      .map(schema => ({
        $ref: schema.$id,
      })),
  }

  const allDefinitions: SchemaMap = {
    ...definitions,
    FileFormat: fileFormat,
    Document: document,
    AnyLayer: anyLayer,
    AnyGroup: anyGroup,
  }

  const types: ts.DeclarationStatement[] = Object.keys(allDefinitions).map(
    key => schemaToTopLevelDeclaration(allDefinitions[key]),
  )

  writeFileSync(
    outFile,
    ts
      .createPrinter()
      .printList(
        ts.ListFormat.MultiLine,
        ts.createNodeArray(types),
        ts.createSourceFile(
          outFile,
          '',
          ts.ScriptTarget.Latest,
          false,
          ts.ScriptKind.TS,
        ),
      ),
  )

  execSync(`yarn prettier --write ${outFile}`)
}

generate('119', schemas119)
generate('120', schemas120)
generate('121', schemas121)
