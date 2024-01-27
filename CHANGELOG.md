# Changelog

## [2.1.0](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v2.0.0...v2.1.0) (2024-01-27)


### Features

* add support for esm builds ([74b77cf](https://github.com/eoin-obrien/prisma-extension-kysely/commit/74b77cf5e1ef944b861d328e3bf1c5cdf8b997bc)), closes [#43](https://github.com/eoin-obrien/prisma-extension-kysely/issues/43)
* configure dual package build with esm and cjs ([a05391a](https://github.com/eoin-obrien/prisma-extension-kysely/commit/a05391a0938badb3295fc1ce4980f86a73ca88b0))

## [2.0.0](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v1.0.4...v2.0.0) (2024-01-20)


### ⚠ BREAKING CHANGES

* Remove the $kyselyQuery and $kyselyExecute methods.
* Change the way the extension is initialized.

### Features

* enable use of kysely in prisma's interactive transactions ([04865ee](https://github.com/eoin-obrien/prisma-extension-kysely/commit/04865ee0a61323d508ca7ce0ebe1f5d9ae23c5cb))
* overhaul extension to work as a kysely driver to enable plugins and a more fluent qpi ([60d8040](https://github.com/eoin-obrien/prisma-extension-kysely/commit/60d8040f756e46b64edd1cc2f0eac3f4d2b5fe0d)), closes [#29](https://github.com/eoin-obrien/prisma-extension-kysely/issues/29)

## [1.0.4](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v1.0.3...v1.0.4) (2024-01-17)


### Bug Fixes

* **deps:** update prisma monorepo to v5.8.1 ([f9768c6](https://github.com/eoin-obrien/prisma-extension-kysely/commit/f9768c670af13af51c1233cc66dcde8354a1fb2f))

## [1.0.3](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v1.0.2...v1.0.3) (2024-01-11)


### Bug Fixes

* **deps:** update prisma monorepo to v5.7.0 ([1435419](https://github.com/eoin-obrien/prisma-extension-kysely/commit/143541957f0c1685abb64c89beb8a030133ec39d))
* **deps:** update prisma monorepo to v5.7.1 ([97eccc8](https://github.com/eoin-obrien/prisma-extension-kysely/commit/97eccc8c4dcc22d73c7564d7760ac8317efbe397))
* **deps:** update prisma monorepo to v5.8.0 ([3e222ac](https://github.com/eoin-obrien/prisma-extension-kysely/commit/3e222ac8a2617f95f44bc4c595dbf184e1ad4e49))

## [1.0.2](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v1.0.1...v1.0.2) (2023-12-01)


### Bug Fixes

* **npm:** add prepack script ([e308104](https://github.com/eoin-obrien/prisma-extension-kysely/commit/e308104ed8c5578dc709e0e8e1f6de2998ad7fe3))

## [1.0.1](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v1.0.0...v1.0.1) (2023-11-28)


### Bug Fixes

* **deps:** update prisma monorepo to v5 ([9de0e57](https://github.com/eoin-obrien/prisma-extension-kysely/commit/9de0e5774446f86b93bbe71fcfce41acf681e9d9))
* **npm:** add missing license field to package.json ([98de68d](https://github.com/eoin-obrien/prisma-extension-kysely/commit/98de68d1b57f7a7ecd3145cab82749e9de34f9c7))

## 1.0.0 (2023-11-27)


### Features

* implement prisma extension ([ba534d6](https://github.com/eoin-obrien/prisma-extension-kysely/commit/ba534d663b3a020306c168485b8b9739d54f7a53))
