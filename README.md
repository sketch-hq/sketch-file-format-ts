# Sketch File Format TS

> TypeScript types for the Sketch File Format

## Overview

This repo contains TypeScript types automatically generated from the [Sketch File Format](https://github.com/sketch-hq/sketch-file-format) JSON Schemas.

Types are exported for each Sketch document `version` starting with `119`. See usage instructions below for more information.

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

Types for the latest Sketch document `version` are on the default export

```typescript
import FileFormat from '@sketch-hq/sketch-file-format'
```

Types for historical Sketch document versions are accessible via named exports

```typescript
import {
  FileFormat119,
  FileFormat120,
  FileFormat121,
} from '@sketch-hq/sketch-file-format'
```

## Examples

Create a typed layer blur object

```typescript
import FileFormat from '@sketch-hq/sketch-file-format'

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
import FileFormat from '@sketch-hq/sketch-file-format'

const mapLayers = (layers: FileFormat.AnyLayer[]) => {
  return layers.map(layer => {
    switch (layer._class) {
      case 'bitmap':
      // layer type narrows to Bitmap
      case 'star':
      // layer type narrowed to Star
    }
  })
}
```

Work with representations of Sketch files that could have a range of document versions

```typescript
import {
  FileFormat119,
  FileFormat120,
  FileFormat121,
} from '@sketch-hq/sketch-file-format'

const processDocumentContents = (
  contents:
    | FileFormat121.FileFormat
    | FileFormat120.FileFormat
    | FileFormat119.FileFormat,
) => {
  if (contents.meta.version === 119) {
    // type narrowed to documents with version 119
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
