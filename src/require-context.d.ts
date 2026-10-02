// Webpack's require.context, used to auto-register every theme in /themes.
declare namespace NodeJS {
  interface Require {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp,
    ): {
      keys(): string[];
      (id: string): unknown;
    };
  }
}
