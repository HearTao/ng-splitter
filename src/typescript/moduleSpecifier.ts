import { CompilerOptions, ModuleResolutionKind } from "typescript";
import { startsWith, endsWith, identity, toLowerCase } from "../utils";
import { GetCanonicalFileName, Info, Preferences, RelativePreference, Ending, MapLike } from "./types";
import { getDirectoryPath, ensurePathIsNonModuleName, getRelativePathFromDirectory, removeFileExtension, countPathComponents, getEmitModuleResolutionKind, removeExtensionAndIndexPostFix, getRelativePathIfInDirectory, normalizePath, removeTrailingDirectorySeparator, isPathRelativeToParent, getPathRelativeToRootDirs } from "./path";

export function createGetCanonicalFileName(useCaseSensitiveFileNames: boolean): GetCanonicalFileName {
    return useCaseSensitiveFileNames ? identity : toLowerCase;
}

export function getInfo(importingSourceFileName: string): Info {
    const getCanonicalFileName = createGetCanonicalFileName(true);
    const sourceDirectory = getDirectoryPath(importingSourceFileName);
    return { getCanonicalFileName, sourceDirectory };
}

export function getLocalModuleSpecifier(moduleFileName: string, { getCanonicalFileName, sourceDirectory }: Info, compilerOptions: CompilerOptions, { ending, relativePreference }: Preferences): string {
    const { baseUrl, paths, rootDirs } = compilerOptions;

    const relativePath = rootDirs && tryGetModuleNameFromRootDirs(rootDirs, moduleFileName, sourceDirectory, getCanonicalFileName, ending, compilerOptions) ||
        removeExtensionAndIndexPostFix(ensurePathIsNonModuleName(getRelativePathFromDirectory(sourceDirectory, moduleFileName, getCanonicalFileName)), ending, compilerOptions);
    if (!baseUrl || relativePreference === RelativePreference.Relative) {
        return relativePath;
    }

    const relativeToBaseUrl = getRelativePathIfInDirectory(moduleFileName, baseUrl, getCanonicalFileName);
    if (!relativeToBaseUrl) {
        return relativePath;
    }

    const importRelativeToBaseUrl = removeExtensionAndIndexPostFix(relativeToBaseUrl, ending, compilerOptions);
    const fromPaths = paths && tryGetModuleNameFromPaths(removeFileExtension(relativeToBaseUrl), importRelativeToBaseUrl, paths);
    const nonRelative = fromPaths === undefined ? importRelativeToBaseUrl : fromPaths;

    if (relativePreference === RelativePreference.NonRelative) {
        return nonRelative;
    }

    // Prefer a relative import over a baseUrl import if it has fewer components.
    return isPathRelativeToParent(nonRelative) || countPathComponents(relativePath) < countPathComponents(nonRelative) ? relativePath : nonRelative;
}


function tryGetModuleNameFromRootDirs(rootDirs: readonly string[], moduleFileName: string, sourceDirectory: string, getCanonicalFileName: (file: string) => string, ending: Ending, compilerOptions: CompilerOptions): string | undefined {
    const normalizedTargetPath = getPathRelativeToRootDirs(moduleFileName, rootDirs, getCanonicalFileName);
    if (normalizedTargetPath === undefined) {
        return undefined;
    }

    const normalizedSourcePath = getPathRelativeToRootDirs(sourceDirectory, rootDirs, getCanonicalFileName);
    const relativePath = normalizedSourcePath !== undefined ? ensurePathIsNonModuleName(getRelativePathFromDirectory(normalizedSourcePath, normalizedTargetPath, getCanonicalFileName)) : normalizedTargetPath;
    return getEmitModuleResolutionKind(compilerOptions) === ModuleResolutionKind.NodeJs
        ? removeExtensionAndIndexPostFix(relativePath, ending, compilerOptions)
        : removeFileExtension(relativePath);
}

export function tryGetModuleNameFromPaths(relativeToBaseUrlWithIndex: string, relativeToBaseUrl: string, paths: MapLike<readonly string[]>): string | undefined {
    for (const key in paths) {
        for (const patternText of paths[key]) {
            const pattern = removeFileExtension(normalizePath(patternText));
            const indexOfStar = pattern.indexOf("*");
            if (indexOfStar !== -1) {
                const prefix = pattern.substr(0, indexOfStar);
                const suffix = pattern.substr(indexOfStar + 1);
                if (relativeToBaseUrl.length >= prefix.length + suffix.length &&
                    startsWith(relativeToBaseUrl, prefix) &&
                    endsWith(relativeToBaseUrl, suffix) ||
                    !suffix && relativeToBaseUrl === removeTrailingDirectorySeparator(prefix)) {
                    const matchedStar = relativeToBaseUrl.substr(prefix.length, relativeToBaseUrl.length - suffix.length);
                    return key.replace("*", matchedStar);
                }
            }
            else if (pattern === relativeToBaseUrl || pattern === relativeToBaseUrlWithIndex) {
                return key;
            }
        }
    }
}