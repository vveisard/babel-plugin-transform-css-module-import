// src/index.ts
import { dirname, join } from "node:path";
import {
  identifier,
  objectExpression,
  objectProperty,
  stringLiteral,
  variableDeclaration,
  variableDeclarator
} from "@babel/types";
function createObjectExpressionFromCssModuleExports(cssModuleExports) {
  return objectExpression(
    Object.keys(cssModuleExports).map(
      (token) => objectProperty(
        stringLiteral(token),
        stringLiteral(cssModuleExports[token])
      )
    )
  );
}
function importDeclarationSourceMatches(source) {
  const parts = source.split(".");
  return parts.at(-1) === "css" && parts.at(-2) === "module";
}
function plugin(options) {
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
        if (absoluteSourceFilePath === void 0) {
          throw new Error(
            `Invalid state! state.filename missing. (Did you define options.filename?)`
          );
        }
        const absoluteSourceDirPath = dirname(
          absoluteSourceFilePath
        );
        const absoluteCssFilePath = join(
          absoluteSourceDirPath,
          path.node.source.value
        );
        const cssModuleExports = options.getCssModuleExports(
          options.absoluteRootDirPath,
          state,
          absoluteCssFilePath
        );
        path.replaceWith(
          variableDeclaration(
            "const",
            [
              variableDeclarator(
                identifier(specifier.local.name),
                createObjectExpressionFromCssModuleExports(
                  cssModuleExports
                )
              )
            ]
          )
        );
      }
    }
  };
}
var src_default = plugin;
export {
  src_default as default
};
