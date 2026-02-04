# Changelog

## [1.2.3](https://github.com/nolway/wa-map-optimizer-vite/compare/v1.2.2...v1.2.3) (2026-02-04)


### Bug Fixes

* assets dir can overrid by vite configuration "assetsDir" ([f1d9eab](https://github.com/nolway/wa-map-optimizer-vite/commit/f1d9eab8a0c1b0910f3c938981a054ea2481fb8d))

## [1.2.2](https://github.com/nolway/wa-map-optimizer-vite/compare/v1.2.1...v1.2.2) (2026-02-03)


### Bug Fixes

* Improve to compile js ([#31](https://github.com/nolway/wa-map-optimizer-vite/issues/31)) ([7297ccd](https://github.com/nolway/wa-map-optimizer-vite/commit/7297ccd80e4dfa041ee4c85d0416434af7749055))

## [1.2.1](https://github.com/nolway/wa-map-optimizer-vite/compare/v1.2.0...v1.2.1) (2025-12-30)


### Features

* use OIDC npm connection ([946df68](https://github.com/nolway/wa-map-optimizer-vite/commit/946df689cc65cd40cc3a1f72661a5d2341892735))


### Miscellaneous Chores

* **master:** release 1.2.1 ([2884f9f](https://github.com/nolway/wa-map-optimizer-vite/commit/2884f9f7e265ae08d407e84e77e312b06202cb00))

## [1.2.0](https://github.com/nolway/wa-map-optimizer-vite/compare/v1.1.31...v1.2.0) (2025-12-29)


### Features

* add integration tests and verification script for wa-map-optimizer-vite plugin + contributing guidelines ([fce477a](https://github.com/nolway/wa-map-optimizer-vite/commit/fce477a8a8200a50b441f2163965ccbd651cef02))
* Wrapping scripts into generated HTML file ([a312628](https://github.com/nolway/wa-map-optimizer-vite/commit/a3126284c1b4fd12eabccdccce4907147f2f89de))
* Wrapping scripts into generated HTML file ([8b25803](https://github.com/nolway/wa-map-optimizer-vite/commit/8b25803a730fe057ec591a870c57e7bc46b56517))


### Bug Fixes

* Correctly handling script name collisions ([9ddf5d8](https://github.com/nolway/wa-map-optimizer-vite/commit/9ddf5d8d77e1e8564f5ea6d589cf73f2b8ed0b6f))
* Migrating plugin to be compatible with Vite 4 to 7 ([d59a10d](https://github.com/nolway/wa-map-optimizer-vite/commit/d59a10d169172227b39ed25b0498ee29fd23e969))

## [Unreleased]

### Added

- New `WaMapOptimizerOptions` interface extending `OptimizeOptions` with `playUrl` option
- HTML wrapper generation for compiled scripts that includes the WorkAdventure iframe API
- Support for `PLAY_URL` environment variable to configure the WorkAdventure Play URL

### Changed

- **BREAKING**: The `script` property in TMJ maps now points to an HTML wrapper file instead of directly to the compiled JS file
- The HTML wrapper loads both the WorkAdventure iframe API (from the configured Play URL) and the compiled script
- Generated HTML files follow the naming pattern `scriptname-hash.html` (matching the JS file hash)
- Updated `getMapsOptimizers` signature to accept `WaMapOptimizerOptions` instead of `OptimizeOptions`

### Notes

- The `playUrl` can be configured via:
  1. `playUrl` option in `WaMapOptimizerOptions`
  2. `PLAY_URL` environment variable
  3. Defaults to `https://play.workadventu.re` if neither is set

## [1.1.31](https://github.com/nolway/wa-map-optimizer-vite/compare/v1.1.30...v1.1.31) (2025-09-08)


### Bug Fixes

* Adding a README ([8b9a781](https://github.com/nolway/wa-map-optimizer-vite/commit/8b9a78139aa30691a90d291f21c3e7e1b88656cd))

## [1.1.30](https://github.com/Nolway/wa-map-optimizer-vite/compare/v1.1.29...v1.1.30) (2025-01-15)


### Bug Fixes

* Fixing crash when mapImage property is empty ([11441ec](https://github.com/Nolway/wa-map-optimizer-vite/commit/11441ec4bf5642009b248b9b4d79b669ef5d5463))

## [1.1.29](https://github.com/Nolway/wa-map-optimizer-vite/compare/v1.1.28...v1.1.29) (2024-06-19)


### Bug Fixes

* Upgrading some dependencies ([ec2271c](https://github.com/Nolway/wa-map-optimizer-vite/commit/ec2271cccfb0fd9545b387fe25551210ba77f74c))
* Upgrading to wa-map-optimizer 1.4.8 ([bcdd607](https://github.com/Nolway/wa-map-optimizer-vite/commit/bcdd6074bd2313aaca8eb684ad27bf10577813b7))

## [1.1.28](https://github.com/Nolway/wa-map-optimizer-vite/compare/v1.1.30...v1.1.28) (2023-12-14)


### Bug Fixes

* Upgrading some dependencies ([ec2271c](https://github.com/Nolway/wa-map-optimizer-vite/commit/ec2271cccfb0fd9545b387fe25551210ba77f74c))


### Miscellaneous Chores

* release 1.1.28 ([553d8f8](https://github.com/Nolway/wa-map-optimizer-vite/commit/553d8f81631dc3977aa0049d127b3822a1d6a7fe))

## [1.1.28](https://github.com/Nolway/wa-map-optimizer-vite/compare/v1.1.25...v1.1.28) (2023-11-24)


### Miscellaneous Chores

* release 1.1.28 ([553d8f8](https://github.com/Nolway/wa-map-optimizer-vite/commit/553d8f81631dc3977aa0049d127b3822a1d6a7fe))
