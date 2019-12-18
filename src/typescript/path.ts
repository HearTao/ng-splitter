import {
  startsWith,
  removeSuffix,
  find,
  some,
  equateStringsCaseSensitive,
  identity,
  equateStringsCaseInsensitive,
  lastOrUndefined,
  endsWith,
  firstDefined
} from '../utils'
import { CharacterCodes, Ending, GetCanonicalFileName } from './types'
import {
  CompilerOptions,
  Extension,
  JsxEmit,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget
} from 'typescript'

export function getDirectoryPath(path: string): string
export function getDirectoryPath(path: string): string {
  path = normalizeSlashes(path)

  // If the path provided is itself the root, then return it.
  const rootLength = getRootLength(path)
  if (rootLength === path.length) return path

  // return the leading portion of the path up to the last (non-terminal) directory separator
  // but not including any trailing directory separator.
  path = removeTrailingDirectorySeparator(path)
  return path.slice(
    0,
    Math.max(rootLength, path.lastIndexOf(directorySeparator))
  )
}

export function countPathComponents(path: string): number {
  let count = 0
  for (let i = startsWith(path, './') ? 2 : 0; i < path.length; i++) {
    if (path.charCodeAt(i) === CharacterCodes.slash) count++
  }
  return count
}

export function removeExtensionAndIndexPostFix(
  fileName: string,
  ending: Ending,
  options: CompilerOptions
): string {
  if (fileExtensionIs(fileName, Extension.Json)) return fileName
  const noExtension = removeFileExtension(fileName)
  switch (ending) {
    case Ending.Minimal:
      return removeSuffix(noExtension, '/index')
    case Ending.Index:
      return noExtension
    case Ending.JsExtension:
      return noExtension + getJSExtensionForFile(fileName, options)
  }
}

export function extensionFromPath(path: string): Extension {
  return tryGetExtensionFromPath(path)!
}

export function tryGetExtensionFromPath(path: string): Extension | undefined {
  return find<Extension>(extensionsToRemove, e => fileExtensionIs(path, e))
}

export function getJSExtensionForFile(
  fileName: string,
  options: CompilerOptions
): Extension {
  const ext = extensionFromPath(fileName)
  switch (ext) {
    case Extension.Ts:
    case Extension.Dts:
      return Extension.Js
    case Extension.Tsx:
      return options.jsx === JsxEmit.Preserve ? Extension.Jsx : Extension.Js
    case Extension.Js:
    case Extension.Jsx:
    case Extension.Json:
      return ext
    default:
      throw new Error('not supported')
  }
}

export function getEmitModuleResolutionKind(compilerOptions: CompilerOptions) {
  let moduleResolution = compilerOptions.moduleResolution
  if (moduleResolution === undefined) {
    moduleResolution =
      getEmitModuleKind(compilerOptions) === ModuleKind.CommonJS
        ? ModuleResolutionKind.NodeJs
        : ModuleResolutionKind.Classic
  }
  return moduleResolution
}

export function getEmitScriptTarget(compilerOptions: CompilerOptions) {
  return compilerOptions.target || ScriptTarget.ES3
}

export function getEmitModuleKind(compilerOptions: {
  module?: CompilerOptions['module']
  target?: CompilerOptions['target']
}) {
  return typeof compilerOptions.module === 'number'
    ? compilerOptions.module
    : getEmitScriptTarget(compilerOptions) >= ScriptTarget.ES2015
    ? ModuleKind.ES2015
    : ModuleKind.CommonJS
}

export function pathIsAbsolute(path: string): boolean {
  return getEncodedRootLength(path) !== 0
}

export function pathIsRelative(path: string): boolean {
  return /^\.\.?($|[\\/])/.test(path)
}

export function ensurePathIsNonModuleName(path: string): string {
  return !pathIsAbsolute(path) && !pathIsRelative(path) ? './' + path : path
}

export function getRelativePathIfInDirectory(
  path: string,
  directoryPath: string,
  getCanonicalFileName: GetCanonicalFileName
): string | undefined {
  const relativePath = getRelativePathToDirectoryOrUrl(
    directoryPath,
    path,
    directoryPath,
    getCanonicalFileName,
    /*isAbsolutePathAnUrl*/ false
  )
  return isRootedDiskPath(relativePath) ? undefined : relativePath
}

export function isRootedDiskPath(path: string) {
  return getEncodedRootLength(path) > 0
}

export function resolvePath(
  path: string,
  ...paths: (string | undefined)[]
): string {
  return normalizePath(
    some(paths) ? combinePaths(path, ...paths) : normalizeSlashes(path)
  )
}

export function getRelativePathToDirectoryOrUrl(
  directoryPathOrUrl: string,
  relativeOrAbsolutePath: string,
  currentDirectory: string,
  getCanonicalFileName: GetCanonicalFileName,
  isAbsolutePathAnUrl: boolean
) {
  const pathComponents = getPathComponentsRelativeTo(
    resolvePath(currentDirectory, directoryPathOrUrl),
    resolvePath(currentDirectory, relativeOrAbsolutePath),
    equateStringsCaseSensitive,
    getCanonicalFileName
  )

  const firstComponent = pathComponents[0]
  if (isAbsolutePathAnUrl && isRootedDiskPath(firstComponent)) {
    const prefix =
      firstComponent.charAt(0) === directorySeparator ? 'file://' : 'file:///'
    pathComponents[0] = prefix + firstComponent
  }

  return getPathFromPathComponents(pathComponents)
}

export function getRelativePathFromDirectory(
  from: string,
  to: string,
  ignoreCase: boolean
): string
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileName: GetCanonicalFileName
): string // eslint-disable-line @typescript-eslint/unified-signatures
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileNameOrIgnoreCase: GetCanonicalFileName | boolean
) {
  const getCanonicalFileName =
    typeof getCanonicalFileNameOrIgnoreCase === 'function'
      ? getCanonicalFileNameOrIgnoreCase
      : identity
  const ignoreCase =
    typeof getCanonicalFileNameOrIgnoreCase === 'boolean'
      ? getCanonicalFileNameOrIgnoreCase
      : false
  const pathComponents = getPathComponentsRelativeTo(
    fromDirectory,
    to,
    ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive,
    getCanonicalFileName
  )
  return getPathFromPathComponents(pathComponents)
}

export function ensureTrailingDirectorySeparator(path: string): string
export function ensureTrailingDirectorySeparator(path: string) {
  if (!hasTrailingDirectorySeparator(path)) {
    return path + directorySeparator
  }

  return path
}

export function getPathFromPathComponents(pathComponents: readonly string[]) {
  if (pathComponents.length === 0) return ''

  const root =
    pathComponents[0] && ensureTrailingDirectorySeparator(pathComponents[0])
  return root + pathComponents.slice(1).join(directorySeparator)
}

export function getPathComponents(path: string, currentDirectory = '') {
  path = combinePaths(currentDirectory, path)
  return pathComponents(path, getRootLength(path))
}

export function pathComponents(path: string, rootLength: number) {
  const root = path.substring(0, rootLength)
  const rest = path.substring(rootLength).split(directorySeparator)
  if (rest.length && !lastOrUndefined(rest)) rest.pop()
  return [root, ...rest]
}

export function getRootLength(path: string) {
  const rootLength = getEncodedRootLength(path)
  return rootLength < 0 ? ~rootLength : rootLength
}

export function isVolumeCharacter(charCode: number) {
  return (
    (charCode >= CharacterCodes.a && charCode <= CharacterCodes.z) ||
    (charCode >= CharacterCodes.A && charCode <= CharacterCodes.Z)
  )
}

export function getEncodedRootLength(path: string): number {
  if (!path) return 0
  const ch0 = path.charCodeAt(0)

  // POSIX or UNC
  if (ch0 === CharacterCodes.slash || ch0 === CharacterCodes.backslash) {
    if (path.charCodeAt(1) !== ch0) return 1 // POSIX: "/" (or non-normalized "\")

    const p1 = path.indexOf(
      ch0 === CharacterCodes.slash ? directorySeparator : altDirectorySeparator,
      2
    )
    if (p1 < 0) return path.length // UNC: "//server" or "\\server"

    return p1 + 1 // UNC: "//server/" or "\\server\"
  }

  // DOS
  if (isVolumeCharacter(ch0) && path.charCodeAt(1) === CharacterCodes.colon) {
    const ch2 = path.charCodeAt(2)
    if (ch2 === CharacterCodes.slash || ch2 === CharacterCodes.backslash)
      return 3 // DOS: "c:/" or "c:\"
    if (path.length === 2) return 2 // DOS: "c:" (but not "c:d")
  }

  // URL
  const schemeEnd = path.indexOf(urlSchemeSeparator)
  if (schemeEnd !== -1) {
    const authorityStart = schemeEnd + urlSchemeSeparator.length
    const authorityEnd = path.indexOf(directorySeparator, authorityStart)
    if (authorityEnd !== -1) {
      // URL: "file:///", "file://server/", "file://server/path"
      // For local "file" URLs, include the leading DOS volume (if present).
      // Per https://www.ietf.org/rfc/rfc1738.txt, a host of "" or "localhost" is a
      // special case interpreted as "the machine from which the URL is being interpreted".
      const scheme = path.slice(0, schemeEnd)
      const authority = path.slice(authorityStart, authorityEnd)
      if (
        scheme === 'file' &&
        (authority === '' || authority === 'localhost') &&
        isVolumeCharacter(path.charCodeAt(authorityEnd + 1))
      ) {
        const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(
          path,
          authorityEnd + 2
        )
        if (volumeSeparatorEnd !== -1) {
          if (path.charCodeAt(volumeSeparatorEnd) === CharacterCodes.slash) {
            // URL: "file:///c:/", "file://localhost/c:/", "file:///c%3a/", "file://localhost/c%3a/"
            return ~(volumeSeparatorEnd + 1)
          }
          if (volumeSeparatorEnd === path.length) {
            // URL: "file:///c:", "file://localhost/c:", "file:///c$3a", "file://localhost/c%3a"
            // but not "file:///c:d" or "file:///c%3ad"
            return ~volumeSeparatorEnd
          }
        }
      }
      return ~(authorityEnd + 1) // URL: "file://server/", "http://server/"
    }
    return ~path.length // URL: "file://server", "http://server"
  }

  // relative
  return 0
}

export function getFileUrlVolumeSeparatorEnd(url: string, start: number) {
  const ch0 = url.charCodeAt(start)
  if (ch0 === CharacterCodes.colon) return start + 1
  if (
    ch0 === CharacterCodes.percent &&
    url.charCodeAt(start + 1) === CharacterCodes._3
  ) {
    const ch2 = url.charCodeAt(start + 2)
    if (ch2 === CharacterCodes.a || ch2 === CharacterCodes.A) return start + 3
  }
  return -1
}

export function combinePaths(
  path: string,
  ...paths: (string | undefined)[]
): string {
  if (path) path = normalizeSlashes(path)
  for (let relativePath of paths) {
    if (!relativePath) continue
    relativePath = normalizeSlashes(relativePath)
    if (!path || getRootLength(relativePath) !== 0) {
      path = relativePath
    } else {
      path = ensureTrailingDirectorySeparator(path) + relativePath
    }
  }
  return path
}

export function getPathComponentsRelativeTo(
  from: string,
  to: string,
  stringEqualityComparer: (a: string, b: string) => boolean,
  getCanonicalFileName: GetCanonicalFileName
) {
  const fromComponents = reducePathComponents(getPathComponents(from))
  const toComponents = reducePathComponents(getPathComponents(to))

  let start: number
  for (
    start = 0;
    start < fromComponents.length && start < toComponents.length;
    start++
  ) {
    const fromComponent = getCanonicalFileName(fromComponents[start])
    const toComponent = getCanonicalFileName(toComponents[start])
    const comparer =
      start === 0 ? equateStringsCaseInsensitive : stringEqualityComparer
    if (!comparer(fromComponent, toComponent)) break
  }

  if (start === 0) {
    return toComponents
  }

  const components = toComponents.slice(start)
  const relative: string[] = []
  for (; start < fromComponents.length; start++) {
    relative.push('..')
  }
  return ['', ...relative, ...components]
}

export function removeTrailingDirectorySeparator(path: string): string
export function removeTrailingDirectorySeparator(path: string) {
  if (hasTrailingDirectorySeparator(path)) {
    return path.substr(0, path.length - 1)
  }

  return path
}

const extensionsToRemove = [
  Extension.Dts,
  Extension.Ts,
  Extension.Js,
  Extension.Tsx,
  Extension.Jsx,
  Extension.Json
]
export function removeFileExtension(path: string): string {
  for (const ext of extensionsToRemove) {
    const extensionless = tryRemoveExtension(path, ext)
    if (extensionless !== undefined) {
      return extensionless
    }
  }
  return path
}

export function getPathRelativeToRootDirs(
  path: string,
  rootDirs: readonly string[],
  getCanonicalFileName: GetCanonicalFileName
): string | undefined {
  return firstDefined(rootDirs, rootDir => {
    const relativePath = getRelativePathIfInDirectory(
      path,
      rootDir,
      getCanonicalFileName
    )! // TODO: GH#18217
    return isPathRelativeToParent(relativePath) ? undefined : relativePath
  })
}

export function isPathRelativeToParent(path: string): boolean {
  return startsWith(path, '..')
}

export function tryRemoveExtension(
  path: string,
  extension: string
): string | undefined {
  return fileExtensionIs(path, extension)
    ? removeExtension(path, extension)
    : undefined
}

export function fileExtensionIs(path: string, extension: string): boolean {
  return path.length > extension.length && endsWith(path, extension)
}

export function removeExtension(path: string, extension: string): string {
  return path.substring(0, path.length - extension.length)
}

export function normalizePath(path: string): string {
  path = normalizeSlashes(path)
  const normalized = getPathFromPathComponents(
    reducePathComponents(getPathComponents(path))
  )
  return normalized && hasTrailingDirectorySeparator(path)
    ? ensureTrailingDirectorySeparator(normalized)
    : normalized
}

export function isAnyDirectorySeparator(charCode: number): boolean {
  return (
    charCode === CharacterCodes.slash || charCode === CharacterCodes.backslash
  )
}

export function hasTrailingDirectorySeparator(path: string) {
  return (
    path.length > 0 && isAnyDirectorySeparator(path.charCodeAt(path.length - 1))
  )
}

export const directorySeparator = '/'
const altDirectorySeparator = '\\'
const urlSchemeSeparator = '://'
const backslashRegExp = /\\/g

export function normalizeSlashes(path: string): string {
  return path.replace(backslashRegExp, directorySeparator)
}

export function reducePathComponents(components: readonly string[]) {
  if (!some(components)) return []
  const reduced = [components[0]]
  for (let i = 1; i < components.length; i++) {
    const component = components[i]
    if (!component) continue
    if (component === '.') continue
    if (component === '..') {
      if (reduced.length > 1) {
        if (reduced[reduced.length - 1] !== '..') {
          reduced.pop()
          continue
        }
      } else if (reduced[0]) continue
    }
    reduced.push(component)
  }
  return reduced
}
