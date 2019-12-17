export const enum CharacterCodes {
    _3 = 0x33,

    a = 0x61,
    z = 0x7A,

    A = 0x41,
    Z = 0x5a,
    backslash = 0x5C,             // \
    percent = 0x25,               // %
    colon = 0x3A,                 // :
    slash = 0x2F,                 // /
}

export const enum RelativePreference { Relative, NonRelative, Auto }
export const enum Ending { Minimal, Index, JsExtension }

export interface Preferences {
    readonly relativePreference: RelativePreference;
    readonly ending: Ending;
}

export type GetCanonicalFileName = (fileName: string) => string;

export interface Info {
    readonly getCanonicalFileName: GetCanonicalFileName;
    readonly sourceDirectory: string;
}

export interface MapLike<T> {
    [index: string]: T;
}
