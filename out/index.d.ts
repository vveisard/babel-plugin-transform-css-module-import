import { PluginObj, PluginPass } from '@babel/core';

/**
 * Exports of a CSS module.
 * Record of selector to scoped (compiled) selector.
 */
interface CSSModuleExports {
    /**
     * key: selector.
     * value: scoped (compiled) selector.
     */
    [selector: string]: string;
}
interface PluginOptions {
    /**
     * Path of the root directory, which all file paths are resolved relative to.
     */
    readonly absoluteRootDirPath: string;
    /**
     * @param absoluteCssFilePath path of the CSS module file, relative to the `rootDirPath`.
     */
    getCssModuleExports: (absoluteRootDirPath: string, state: PluginPass, absoluteCssFilePath: string) => CSSModuleExports;
}
/**
 * Transforms CSS module import to a const declaration of that CSS module's exports.
 * @example
 * ```css
 * // App.module.css
 * .foo {
 *   width: 100%;
 *   height: 100%;
 *   background-color: green;
 * }
 * ```
 * Input
 * ```jsx
 * // App.jsx
 * import styles from "./App.module.css";
 * ```
 *
 * Output:
 * ```jsx
 * // App.jsx
 * const styles = {
 *   "foo": "wT-Mma_foo"
 * }
 * ```
 */
declare function plugin(options: PluginOptions): PluginObj;

export { plugin as default };
