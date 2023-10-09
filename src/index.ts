import { dirname, join } from "node:path";
import { type PluginObj, type PluginPass } from "@babel/core";
import {
  identifier,
  ObjectExpression,
  objectExpression,
  objectProperty,
  stringLiteral,
  variableDeclaration,
  variableDeclarator,
} from "@babel/types";

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
  getCssModuleExports: (
    absoluteRootDirPath: string,
    state: PluginPass,
    absoluteCssFilePath: string,
  ) => CSSModuleExports;
}

/**
 * Create an {@link ObjectExpression} from {@link CSSModuleExports}.
 * @param cssModuleExports exports of a CSS module. 
 * @returns An {@link ObjectExpression} 
 */
function createObjectExpressionFromCssModuleExports(
  cssModuleExports: CSSModuleExports,
): ObjectExpression {
  return objectExpression(
    Object.keys(cssModuleExports).map((token) =>
      objectProperty(
        stringLiteral(token),
        stringLiteral(cssModuleExports[token]),
      )
    ),
  );
}

/**
 * Check if the source of an import decleration matches the pattern of a css module.
 */
function importDeclarationSourceMatches(source: string) {
  const parts = source.split(".");

  return (parts.at(-1) === "css" && parts.at(-2) === "module");
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
function plugin(
  options: PluginOptions,
): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.specifiers.length !== 1) {
          return;
        }

        const specifier = path.node.specifiers[0];

        if (specifier.type !== "ImportDefaultSpecifier") {
          return;
        }

        if (!importDeclarationSourceMatches(path.node.source.value)) {
          return;
        }

        const absoluteSourceFilePath = state.filename;

        if (absoluteSourceFilePath === undefined) {
          throw new Error(
            `Invalid state! state.filename missing. (Did you define options.filename?)`,
          );
        }

        const absoluteSourceDirPath = dirname(
          absoluteSourceFilePath,
        );
        const absoluteCssFilePath = join(
          absoluteSourceDirPath,
          path.node.source.value!,
        );

        const cssModuleExports = options.getCssModuleExports(
          options.absoluteRootDirPath,
          state,
          absoluteCssFilePath,
        );

        path.replaceWith(
          variableDeclaration(
            "const",
            [
              variableDeclarator(
                identifier(specifier.local.name),
                createObjectExpressionFromCssModuleExports(
                  cssModuleExports,
                ),
              ),
            ],
          ),
        );
      },
    },
  };
}

export default plugin;
