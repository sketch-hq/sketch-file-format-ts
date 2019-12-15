# Sketch File Format TS

> TypeScript types for the Sketch File Format

## Overview

This repo contains TypeScript types automatically generated from the [Sketch File Format](https://github.com/sketch-hq/sketch-file-format) JSON Schemas.

Types are maintained and exported for each Sketch File Format major version. See usage instructions below for more information.

## Use cases

- Strongly type objects representing Sketch documents, or fragments of Sketch documents in TypeScript projects

## Related projects

- [sketch-file-format](https://github.com/sketch-hq/sketch-file-format)
- [sketch-reference-files](https://github.com/sketch-hq/sketch-reference-files)

## Usage

Add the npm module using `npm` or `yarn`

```sh
npm install @sketch-hq/sketch-file-format-ts
```

Types for the latest file format are on the default export

```typescript
import FileFormat from '@sketch-hq/sketch-file-format-ts'
```

Types for historical file formats are accessible via named exports

```typescript
import {
  FileFormat1,
  FileFormat2,
  FileFormat3,
} from '@sketch-hq/sketch-file-format-ts'
```

> Read about how file format versions map to Sketch document versions [here](https://github.com/sketch-hq/sketch-file-format#sketch-document-version-mapping)

## Examples

Create a typed layer blur object

```typescript
import FileFormat from '@sketch-hq/sketch-file-format-ts'

const blur: FileFormat.Blur = {
  _class: 'blur',
  isEnabled: false,
  center: '{0.5, 0.5}',
  motionAngle: 0,
  radius: 10,
  saturation: 1,
  type: FileFormat.BlurType.Gaussian,
}
```

Layer types can be narrowed using discriminated unions

```typescript
import FileFormat from '@sketch-hq/sketch-file-format-ts'

const mapLayers = (layers: FileFormat.AnyLayer[]) => {
  return layers.map(layer => {
    switch (layer._class) {
      case 'bitmap':
      // type narrowed to Bitmap
      case 'star':
      // type narrowed to Star
    }
  })
}
```

Work with representations of Sketch files that could have a range of document versions

```typescript
import {
  FileFormat1,
  FileFormat2,
  FileFormat3,
} from '@sketch-hq/sketch-file-format-ts'

const processDocumentContents = (
  contents: FileFormat1.Contents | FileFormat2.Contents | FileFormat3.Contents,
) => {
  if (contents.meta.version === 119) {
    // type narrowed to file format v1, i.e. Sketch documents with version 119
  } else {
    // type narrowed to a union of document versions 120 and 121
  }
}
```

## Scripts

| Script            | Description                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| yarn build        | Builds the project into the `dist` folder                                                                                                                              |
| yarn test         | Build script unit tests                                                                                                                                                |
| yarn format-check | Checks the repo with Prettier                                                                                                                                          |
| yarn release      | Tags the repo and updates the changelog and semver automatically based on commit history. You'll still need to push the changes and `yarn publish` manually afterwards |
