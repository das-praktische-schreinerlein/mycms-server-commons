# Changelog of MyCMS
 
# Versions

## 6.2.0 (2025-01-27)
- bumped version up to be in sync with mycms-frontend-commons, mycms-commons
- interpret parameter loadDetailsMode of GenericSearchOptions on server-request
- improved pdf-generation
- added CommonDocPdfResultListDecorator for generating pdf-resultlist

### new features
- added CommonDocPdfResultListDecorator for generating pdf-resultlist

### improvements
- improved pdf-generation

### bug fixes
- none

### breaking changes
- interpret parameter loadDetailsMode of GenericSearchOptions on server-request


## 6.1.0 (2024-05-12)
- backend: added pre-generated pdf-support for cdoc and pages
- backend: playlistservice - add csv-export
- backend: added pdf-manager

### new features
- backend: added pre-generated pdf-support for cdoc and pages
- backend: added pdf-manager

### improvements
- backend: playlistservice - add csv-export

### bug fixes
- none

### breaking changes
- none


## 6.0.0 (2023-12-22)
- bumped up deps
- moved ValidationRules to commons
- introduced fully featured pdoc-modules derived from cdoc
- improved BackendConfigTypes
- backend: added page-management
- backend: use fully featured markdown-support with extensions
- backend: fixed naming of attributes/filter: type_s)

### new features
- introduced fully featured pdoc-modules derived from cdoc
- backend: added page-management

### improvements
- improved BackendConfigTypes
- backend: use fully featured markdown-support with extensions

### bug fixes
- fixed string-replace

### breaking changes
- bumped up deps
- moved ValidationRules to commons
- backend: fixed naming of attributes/filter: type_s)


## 5.7.0 (2023-03-18)
- improved reading of image-metadata, audio-metadata

### new features
- none

### improvements
- backend: improved reading of image-metadata, audio-metadata

### bug fixes
- none

### breaking changes
- backend: CommonDocMusicFileImportManager must implement createMediaMetaRecord


## 5.6.0 (2023-01-19)
- bumped version up to be in sync with mycms-server-commons, mycms-commons
- server-commons: added viewer-manager-module

### new features
- server-commons: added viewer-manager-module

### improvements
- build: upgraded typescript

### bug fixes
- none

### breaking changes
- none


## 5.5.0 (2022-08-29)
- bumped version up to be in sync with mycms-frontend-commons, mycms-commons
- fixed error-handling of media-manager

### new features
- none

### improvements
- none

### bug fixes
- backend: fixed error-handling of media-manager

### breaking changes
- none


## 5.4.0 (2021-11-25)
- bumped version up to be in sync with mycms-frontend-commons, mycms-commons

### new features
- none

### improvements
- none

### bug fixes
- none

### breaking changes
- none


## 5.3.0 (2021-05-13)
- commons: added ConfigInitializerCommand

### new features
- commons: added ConfigInitializerCommand

### improvements
- none

### bug fixes
- none

### breaking changes
- none


## 5.2.0 (2021-02-05)
- backend: added admin-server-support

### new features
- backend: added admin-command/server/cli-module with parameter-validation and configurable command-restrictions
- backend: added abstract commands to use for db/webcall-commands and dbmigrate
- backend: CommonDocMediaManagerModule added functions to scaleVideo-defaults 
- backend: MediaManagerModule improved handling and added functions to render scale single files

### improvements
- backend: added bindIp+tcpBacklog for backend-config
- backend: improved mediafile-importer to optionally check if file already exists in database

### bug fixes
- none
 
### breaking changes
- none


## 5.1.0 (2020-12-20)
- added new modules for media-management
- added and use ConfigurationTypes
- added extended firewall-config

### new features
- backend: added new modules for media-management (export, import)

### improvements
- backend: added and use ConfigurationTypes
- backend: added extended firewall-config
- common: fixed imports

### bug fixes
- none 
 
### breaking changes
- none


## 5.0.0 (2020-08-26)
- upgraded all dev-dependencies to latest
- build: use peerDependencies

### new features
- none

### improvements
- none

### bug fixes
- none 
 
### breaking changes
- build: upgraded all dev-dependencies to latest
- build: use peerDependencies


## 4.5.0 (2020-07-11)
- bumped version up to be in sync with mycms-frontend-commons, mycms-commons

### new features
- none

### improvements
- none

### bug fixes
- none 
 
### breaking changes
- none


## 4.4.0 (2020-05-24)
- bumped version up to be in sync with mycms-frontend-commons

### new features
- none

### improvements
- none

### bug fixes
- none 
 
### breaking changes
- none


## 4.3.0 (2020-03-20)
- improved build-process 

### new features
- none

### improvements
- backend: added loadDetailsMode='details' for search of element by Id in cdocServerModule
- development: improved build-process - activated tests+coverage

### bug fixes
- none
 
### breaking changes
- none

### known issues
- none


## 4.2.0 (2019-09-07)
- bumped version up to be in sync with mycms

### new features
- none

### improvements
- none

### bug fixes
- none
 
### breaking changes
- none

### known issues
- none


## 4.1.0 (2019-02-11)
- improved build-process

### new features
- none

### improvements
- improved build-process: cross-platform rm/mkdir/copy/patch
 
### bug fixes
- none
 
### breaking changes
- none


## 4.0.0 (2018-11-07)
- bumped version up to be in sync with mycms

### new features
- none
 
### improvements
- none
 
### bug fixes
- none
 
### breaking changes
- none


## 3.0.0 (2018-10-10)
- added playlist-export

### new features
- backend: added CommonDocPlaylistServerModule
 
### improvements
- none
 
### bug fixes
- none
 
### breaking changes
- none


## 2.0.0 (2018-09-13)
- improved dependencies

### new features
- none
 
### improvements
- bumped up and improved dependencies
 
### bug fixes
- none
 
### breaking changes
- none


## 1.0.0 (2018-09-02)
- initial version based on mytourbook-1.5.0

### new features
- none
 
### improvements
- initial version: everything is a improvement
 
### bug fixes
- initial version: none
 
### breaking changes
- initial version: none
