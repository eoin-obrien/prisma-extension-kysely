# [4.0.0](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v3.0.1...v4.0.0) (2026-02-25)


### Bug Fixes

* **release:** add breakingHeaderPattern to recognize feat! commits ([#360](https://github.com/eoin-obrien/prisma-extension-kysely/issues/360)) ([c0e75db](https://github.com/eoin-obrien/prisma-extension-kysely/commit/c0e75dbae31f59ded3e59d0e21d06d8256754c23))


### Features

* add Prisma 7 support with driver adapters ([#359](https://github.com/eoin-obrien/prisma-extension-kysely/issues/359)) ([8417ed2](https://github.com/eoin-obrien/prisma-extension-kysely/commit/8417ed22520537660d42fd325191c1cbe6525d47))


### BREAKING CHANGES

* add Prisma 7 support with driver adapters (#359)

## [3.0.1](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v3.0.0...v3.0.1) (2026-02-24)


### Bug Fixes

* **deps:** pin peer deps and bump dev dependencies for pre-v4 release ([0ca8c56](https://github.com/eoin-obrien/prisma-extension-kysely/commit/0ca8c56347078154b5ce2d663e0fd18dcd47509e))
* import Prisma from @prisma/client/extension for custom output path support ([f1be74c](https://github.com/eoin-obrien/prisma-extension-kysely/commit/f1be74cfd7c6f2fd535823e9c81aef4a30c5f783)), closes [#245](https://github.com/eoin-obrien/prisma-extension-kysely/issues/245)
* preserve caller stack trace in query errors ([#344](https://github.com/eoin-obrien/prisma-extension-kysely/issues/344)) ([4dcc793](https://github.com/eoin-obrien/prisma-extension-kysely/commit/4dcc793bc922f78ed05cf8db2e03bddb30424bc9)), closes [#189](https://github.com/eoin-obrien/prisma-extension-kysely/issues/189)

# Changelog

## [3.0.0](https://github.com/eoin-obrien/prisma-extension-kysely/compare/v2.1.0...v3.0.0) (2024-10-24)


### ⚠ BREAKING CHANGES

* This change introduces an error where previously there was none, which may affect existing code that accidentally extended the Prisma client multiple times.

### Features

* throw error if Prisma client is already extended with Kysely ([e05b789](https://github.com/eoin-obrien/prisma-extension-kysely/commit/e05b789de80073d189b12457c8614837d56c8e17))
* throw error if Prisma client is already extended with Kysely ([f826055](https://github.com/eoin-obrien/prisma-extension-kysely/commit/f8260559fdddf28a3d587e10d6cff25fe38467a4))

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
