"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pathLib = require("path");
var fs = require("fs");
var Promise_serial = require("promise-serial");
var readdirp = require("readdirp");
var name_utils_1 = require("@dps/mycms-commons/dist/commons/utils/name.utils");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var CommonDocMusicFileImportManager = /** @class */ (function () {
    function CommonDocMusicFileImportManager(baseDir, mediaManager) {
        this.mediaManager = mediaManager;
        this.unknownGenre = 'Unbekanntes Genre';
        this.unknownArtist = 'Unbekannter Artist';
        this.unknownAlbum = 'Unbekanntes Album';
        this.baseDir = baseDir;
    }
    CommonDocMusicFileImportManager.prototype.generateMusicDocRecordsFromMediaDir = function (mapper, responseMapper, baseDir, mappings) {
        var me = this;
        var normalizedMapping = JSON.parse(JSON.stringify(mappings).replace(/"([^"]+)":/g, function ($0, $1) {
            var value = $1.toLocaleLowerCase();
            return ('"' + name_utils_1.NameUtils.normalizeNames(value, value) + '":');
        }));
        var mediaTypes = this.getFileExtensionToTypeMappings();
        var fileExtensions = [];
        for (var mediaType in mediaTypes) {
            if (!mediaTypes.hasOwnProperty(mediaType)) {
                continue;
            }
            fileExtensions.push('*.' + mediaType);
        }
        var settings = {
            root: baseDir,
            entryType: 'files',
            // Filter files with js and json extension
            fileFilter: fileExtensions,
            // Filter by directory
            directoryFilter: ['!.git', '!*modules'],
            // Work with files up to 1 subdirectory deep
            depth: 10
        };
        var container = {
            ALBUM: {},
            ARTIST: {},
            AUDIO: {},
            FILES: {},
            ALBUMCOVERFILES: {},
            ALBUMFOLDER: {},
            GENRE: {},
            GENREARTISTS: {}
        };
        var records = [];
        return new Promise(function (allresolve, allreject) {
            readdirp(settings, function fileCallBack(fileRes) {
                var path = fileRes['path'].replace(/\\/g, '/');
                var extension = pathLib.extname(path).replace('.', '');
                if (mediaTypes[extension] === undefined) {
                    console.warn('SKIP file - unknown extension', extension, path);
                    return;
                }
                if (container.FILES[path]) {
                    return;
                }
                container.FILES[path] = fileRes;
            }, function allCallBack(errors) {
                me.generateMusicDocsForImportContainer(container, mediaTypes, baseDir, mappings, mapper, responseMapper).then(function (records) {
                    return allresolve(records);
                }).catch(function (reason) {
                    return allreject(reason);
                });
                if (errors) {
                    errors.forEach(function (err) {
                        return allreject(err);
                    });
                }
            });
        });
    };
    CommonDocMusicFileImportManager.prototype.generateMusicDocsForImportContainer = function (container, mediaTypes, baseDir, mappings, mapper, responseMapper) {
        var me = this;
        var records = [];
        var funcs = [];
        var _loop_1 = function (path) {
            if (!container.FILES.hasOwnProperty(path)) {
                return "continue";
            }
            console.warn('check path', path);
            var extension = pathLib.extname(path).replace('.', '');
            if (mediaTypes[extension] === 'AUDIO') {
                funcs.push(function () {
                    return new Promise(function (processorResolve) {
                        return me.checkMusicFile(path, records, container, container.FILES[path]['stat'])
                            .then(function (checkFileResult) {
                            if (!checkFileResult.readyToImport) {
                                console.warn('SKIPPING file: ' + path, checkFileResult);
                                processorResolve(path);
                                return Promise.resolve();
                            }
                            return me.mediaManager.readMusicTagsForMusicFile(baseDir + '/' + path)
                                .then(function (metaData) {
                                var mediaDataContainer = {
                                    genreName: undefined,
                                    albumArtistName: undefined,
                                    albumGenreName: undefined,
                                    albumName: undefined,
                                    artistName: undefined,
                                    titleName: undefined,
                                    trackNr: undefined,
                                    releaseYear: undefined
                                };
                                me.mapAudioMetaDataToMusicMediaData(mappings, path, metaData, mediaDataContainer);
                                return me.checkMusicMediaData(path, records, container, mediaDataContainer, container.FILES[path]['stat'], metaData).then(function (checkMediaDataResult) {
                                    if (!checkMediaDataResult.readyToImport) {
                                        console.warn('SKIPPING file: ' + path, checkMediaDataResult);
                                        processorResolve(path);
                                        return Promise.resolve();
                                    }
                                    return me.createRecordsForMusicMediaData(mapper, responseMapper, path, records, container, mediaDataContainer, container.FILES[path]['stat'], metaData).then(function () {
                                        processorResolve(path);
                                        return Promise.resolve();
                                    });
                                });
                            });
                        }).catch(function (err) {
                            console.error('error while reading file: ' + path, err);
                            processorResolve(path);
                            return Promise.resolve();
                        });
                    });
                });
            }
            else if (mediaTypes[extension] === 'AUDIOCOVER') {
                me.checkAndUpdateAlbumCover(container.ALBUMCOVERFILES, path);
            }
            else {
                console.warn('SKIP file - unknown mediaTypes', mediaTypes[extension], extension, path);
            }
        };
        for (var path in container.FILES) {
            _loop_1(path);
        }
        return Promise_serial(funcs, { parallelize: 1 }).then(function () {
            return Promise.resolve(records);
        }).catch(function errorSearch(reason) {
            console.error('generateMediaDocRecordsFromMediaDir failed:', reason);
            return Promise.reject(reason);
        });
    };
    CommonDocMusicFileImportManager.prototype.checkMusicFile = function (path, records, container, fileStats) {
        return Promise.resolve({
            readyToImport: true,
            hint: 'file is valid'
        });
    };
    CommonDocMusicFileImportManager.prototype.checkMusicMediaData = function (path, records, container, mediaDataContainer, fileStats, metadata) {
        return Promise.resolve({
            readyToImport: true,
            hint: 'musicmetadata is valid'
        });
    };
    CommonDocMusicFileImportManager.prototype.createRecordsForMusicMediaData = function (mapper, responseMapper, path, records, container, mediaDataContainer, fileStats, metadata) {
        var dir = pathLib.dirname(path);
        var coverFile = container.ALBUMCOVERFILES[dir];
        var values = {};
        var normalizedGenreName = name_utils_1.NameUtils.normalizeNames(mediaDataContainer.genreName, this.unknownGenre);
        var normalizedGenreArtistName = 'VA_' + normalizedGenreName;
        var genreKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedGenreName);
        var genreArtistKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedGenreArtistName);
        var genre = container.GENRE[genreKey];
        var genreArtist = container.GENREARTISTS[genreKey];
        if (genre === undefined) {
            genre = responseMapper.mapResponseDocument(mapper, {
                type_s: 'GENRE',
                id: 'GENRE_' + (records.length + 1),
                genre_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                name_s: normalizedGenreName,
                keywords_txt: ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName), 'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(genre);
            container.GENRE[genreKey] = genre;
            genreArtist = responseMapper.mapResponseDocument(mapper, {
                type_s: 'ARTIST',
                id: 'ARTIST_' + (records.length + 1),
                genre_id_i: genre.genreId,
                artist_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                artist_txt: normalizedGenreArtistName,
                name_s: normalizedGenreArtistName,
                keywords_txt: ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName),
                    'Artist_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreArtistName),
                    'KW_Sampler', 'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(genreArtist);
            container.ARTIST[genreArtistKey] = genreArtist;
            container.GENREARTISTS[genreKey] = genreArtist;
        }
        values['genre_id_i'] = genre.genreId;
        var normalizedArtistName = name_utils_1.NameUtils.normalizeNames(mediaDataContainer.artistName, this.unknownArtist);
        var artistKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedArtistName);
        var artist = container.ARTIST[artistKey];
        if (artist === undefined) {
            artist = responseMapper.mapResponseDocument(mapper, {
                type_s: 'ARTIST',
                id: 'ARTIST_' + (records.length + 1),
                genre_id_i: genre.genreId,
                artist_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                artist_txt: normalizedArtistName,
                name_s: normalizedArtistName,
                keywords_txt: ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName),
                    'Artist_' + name_utils_1.NameUtils.normalizeKwNames(normalizedArtistName),
                    'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(artist);
            container.ARTIST[artistKey] = artist;
        }
        values['artist_id_i'] = artist.artistId;
        var normalizedAlbumArtistName = name_utils_1.NameUtils.normalizeNames(mediaDataContainer.albumArtistName, normalizedArtistName);
        var normalizedAlbumName = name_utils_1.NameUtils.normalizeNames(mediaDataContainer.albumName, this.unknownAlbum);
        var albumKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedAlbumArtistName + normalizedAlbumName + dir);
        var albumFolderKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedAlbumName + dir);
        var album = container.ALBUM[albumKey];
        if (album === undefined) {
            var albumArtistKey = name_utils_1.NameUtils.normalizeTechnicalNames(normalizedAlbumArtistName);
            var albumArtist = container.ARTIST[albumArtistKey];
            if (albumArtist === undefined) {
                albumArtist = responseMapper.mapResponseDocument(mapper, {
                    type_s: 'ARTIST',
                    id: 'ARTIST_' + (records.length + 1),
                    artist_id_i: records.length + 1,
                    genre_id_i: genre.genreId,
                    genre_txt: normalizedGenreName,
                    artist_txt: normalizedAlbumArtistName,
                    name_s: normalizedAlbumArtistName,
                    keywords_txt: ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName),
                        'Artist_' + name_utils_1.NameUtils.normalizeKwNames(normalizedAlbumArtistName),
                        'KW_TODOKEYWORDS'].join(', ')
                }, {});
                records.push(albumArtist);
                container.ARTIST[albumArtistKey] = albumArtist;
            }
            album = container.ALBUMFOLDER[albumFolderKey];
            if (album !== undefined) {
                if (album.artistId !== undefined && album.artistId !== genreArtist.artistId) {
                    this.appendLinkedArtistToAlbumRecord(mapper, album, album.artistId, album.artist);
                    album.artistId = genreArtist.artistId;
                    album.artist = genreArtist.name;
                    album.keywords = album.keywords + ', KW_Sampler';
                }
                this.appendLinkedArtistToAlbumRecord(mapper, album, albumArtist.artistId, albumArtist.name);
            }
            else {
                album = responseMapper.mapResponseDocument(mapper, {
                    type_s: 'ALBUM',
                    id: 'ALBUM_' + (records.length + 1),
                    album_id_i: records.length + 1,
                    artist_id_i: albumArtist.artistId,
                    genre_id_i: genre.genreId,
                    genre_txt: normalizedGenreName,
                    artist_txt: normalizedAlbumArtistName,
                    album_txt: normalizedAlbumName,
                    name_s: normalizedAlbumName,
                    i_fav_url_txt: coverFile,
                    keywords_txt: ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName),
                        'Artist_' + name_utils_1.NameUtils.normalizeKwNames(normalizedAlbumArtistName),
                        'KW_TODOKEYWORDS'].join(', '),
                }, {});
                records.push(album);
                container.ALBUM[albumKey] = album;
                container.ALBUMFOLDER[albumFolderKey] = album;
            }
        }
        values['album_id_i'] = album.albumId;
        values['a_fav_url_txt'] = path;
        values['i_fav_url_txt'] = coverFile;
        values['audio_id_i'] = records.length + 1;
        values['type_s'] = 'AUDIO';
        values['id'] = 'AUDIO_' + (records.length + 1);
        values['genre_txt'] = normalizedGenreName;
        values['artist_txt'] = normalizedAlbumArtistName;
        values['album_txt'] = normalizedAlbumName;
        values['name_s'] = mediaDataContainer.titleName;
        values['trackno_i'] = mediaDataContainer.trackNr;
        metadata.common.picture = undefined;
        values['data_tech_metadata_txt'] = JSON.stringify({ metadata: {
                common: metadata.common,
                format: metadata.format,
                quality: metadata.quality
            } }, function (key, value) { if (value !== null) {
            return value;
        } });
        values['data_tech_filesize_i'] = fileStats ? fileStats.size : undefined;
        values['data_tech_filecreated_dt'] = fileStats ? fileStats.mtime : undefined;
        values['data_tech_duration_i'] = metadata && metadata.format && metadata.format.duration
            ? parseFloat(metadata.format.duration.toString()).toFixed()
            : undefined;
        values['keywords_txt'] = ['Genre_' + name_utils_1.NameUtils.normalizeKwNames(normalizedGenreName),
            'Artist_' + name_utils_1.NameUtils.normalizeKwNames(normalizedAlbumArtistName),
            'KW_TODOKEYWORDS'].join(', ');
        var mdoc = responseMapper.mapResponseDocument(mapper, values, {});
        records.push(mdoc);
        container.AUDIO[albumKey + mediaDataContainer.titleName] = mdoc;
        return Promise.resolve(values);
    };
    CommonDocMusicFileImportManager.prototype.extractAndSetCoverFile = function (mdoc, metaData) {
        var mdocAudios = this.getAudiosFromRecord(mdoc);
        if (mdocAudios === undefined || mdocAudios.length <= 0) {
            return Promise.resolve(false);
        }
        var mdocImages = this.getImagesFromRecord(mdoc);
        if ((mdocImages !== undefined && mdocImages.length > 0)
            || metaData.common.picture === undefined || metaData.common.picture.length < 1) {
            return Promise.resolve(false);
        }
        var mdocAudio = mdocAudios[0];
        var destDir = pathLib.dirname(this.baseDir + '/' + mdocAudio.fileName);
        var coverFile = destDir + '/cover.jpg';
        var err = file_utils_1.FileUtils.checkFilePath(coverFile, false, false, false);
        if (err) {
            return Promise.reject('coverFile is invalid: ' + err);
        }
        if (fs.existsSync(coverFile)) {
            return Promise.resolve(false);
        }
        var mimes = this.getMimeTypeToFileExtension();
        var coverContainer = {};
        for (var _i = 0, _a = metaData.common.picture; _i < _a.length; _i++) {
            var picture = _a[_i];
            var ext = mimes[picture.format] || '.unknown';
            var fileName = destDir + '/' +
                ('extract-albumcover-' +
                    name_utils_1.NameUtils.normalizeFileNames(mdoc.album) +
                    '-' +
                    name_utils_1.NameUtils.normalizeFileNames(picture.type) +
                    ext).replace(/ /g, '_');
            this.checkAndUpdateAlbumCover(coverContainer, fileName);
            if (!fs.existsSync(fileName)) {
                fs.writeFileSync(fileName, metaData.common.picture[0].data);
            }
        }
        if (!coverContainer[destDir]) {
            return Promise.resolve(false);
        }
        this.appendCoverImageToRecord(mdoc, coverContainer[destDir]);
        console.log('created coverfile', mdoc.id, mdoc.album, mdoc.name, coverContainer[destDir]);
        return Promise.resolve(true);
    };
    CommonDocMusicFileImportManager.prototype.checkAndUpdateAlbumCover = function (container, path) {
        var dir = pathLib.dirname(path);
        var fileNameBase = pathLib.parse(path).name;
        if (container[dir]) {
            if (fileNameBase.toLocaleLowerCase().endsWith('cover') || fileNameBase.toLocaleLowerCase().startsWith('cover')) {
                container[dir] = path;
            }
            else if (fileNameBase.toLocaleLowerCase().endsWith('large') || fileNameBase.toLocaleLowerCase().startsWith('large')) {
                container[dir] = path;
            }
            else if (fileNameBase.toLocaleLowerCase().endsWith('folder') || fileNameBase.toLocaleLowerCase().startsWith('folder')) {
                container[dir] = path;
            }
            else if (fileNameBase.toLocaleLowerCase().endsWith('front') || fileNameBase.toLocaleLowerCase().startsWith('front')) {
                container[dir] = path;
            }
        }
        else {
            container[dir] = path;
        }
    };
    CommonDocMusicFileImportManager.prototype.mapAudioMetaDataToMusicMediaData = function (mappings, path, metaData, mediaDataContainer) {
        var genreName = name_utils_1.NameUtils.normalizeNames(metaData.common.genre && metaData.common.genre[0].length > 0
            ? metaData.common.genre[0] : '', this.unknownGenre);
        genreName = genreName.replace(/&/g, 'N').replace(/[^-A-Za-z0-9_]+/g, '');
        genreName = name_utils_1.NameUtils.normalizeNames(genreName, this.unknownGenre);
        genreName = name_utils_1.NameUtils.remapData(mappings, 'genre', 'genre', genreName, genreName);
        var artistName = name_utils_1.NameUtils.normalizeNames(metaData.common.artist, name_utils_1.NameUtils.normalizeNames(metaData.common.albumartist, this.unknownArtist));
        genreName = name_utils_1.NameUtils.remapData(mappings, 'artist', 'genre', artistName, genreName);
        artistName = name_utils_1.NameUtils.remapData(mappings, 'artist', 'artist', artistName, artistName);
        var albumArtistName = name_utils_1.NameUtils.normalizeNames(metaData.common.albumartist, name_utils_1.NameUtils.normalizeNames(artistName, this.unknownArtist));
        if (artistName === this.unknownArtist || genreName === this.unknownGenre) {
            genreName = name_utils_1.NameUtils.remapData(mappings, 'artist', 'genre', albumArtistName, genreName);
        }
        albumArtistName = name_utils_1.NameUtils.remapData(mappings, 'artist', 'artist', albumArtistName, albumArtistName);
        var albumName = name_utils_1.NameUtils.normalizeNames(metaData.common.album && metaData.common.album.length > 0
            ? metaData.common.album : '', this.unknownAlbum);
        genreName = name_utils_1.NameUtils.remapData(mappings, 'album', 'genre', albumName, genreName);
        artistName = name_utils_1.NameUtils.remapData(mappings, 'album', 'artist', albumName, artistName);
        albumArtistName = name_utils_1.NameUtils.remapData(mappings, 'album', 'artist', albumName, albumArtistName);
        albumName = name_utils_1.NameUtils.remapData(mappings, 'album', 'album', albumName, albumName);
        var titleName = name_utils_1.NameUtils.normalizeNames(metaData.common.title && metaData.common.title.length > 0
            ? metaData.common.title : '', path);
        genreName = name_utils_1.NameUtils.remapData(mappings, 'audio', 'genre', titleName, genreName);
        artistName = name_utils_1.NameUtils.remapData(mappings, 'audio', 'artist', titleName, artistName);
        albumArtistName = name_utils_1.NameUtils.remapData(mappings, 'audio', 'artist', titleName, albumArtistName);
        albumName = name_utils_1.NameUtils.remapData(mappings, 'audio', 'album', titleName, albumName);
        titleName = name_utils_1.NameUtils.remapData(mappings, 'audio', 'audio', titleName, titleName);
        var trackNr = metaData.common.track ? metaData.common.track.no : undefined;
        mediaDataContainer.genreName = genreName;
        mediaDataContainer.albumArtistName = albumArtistName;
        mediaDataContainer.albumName = albumName;
        mediaDataContainer.artistName = artistName;
        mediaDataContainer.titleName = titleName;
        mediaDataContainer.trackNr = trackNr;
        mediaDataContainer.releaseYear = undefined;
    };
    CommonDocMusicFileImportManager.prototype.mapMediaDataContainerToAudioMetaData = function (mappings, mediaDataContainer, metaData) {
        if (!metaData.common) {
            metaData.common = { disk: { no: 0, of: 0 }, track: { no: 0, of: 0 } };
        }
        if (!metaData.common.track) {
            metaData.common.track = { no: 0, of: 0 };
        }
        if (!Array.isArray(metaData.common.genre)) {
            metaData.common.genre = [];
        }
        metaData.common.genre[0] = mediaDataContainer.genreName;
        metaData.common.artist = mediaDataContainer.artistName;
        metaData.common.album = mediaDataContainer.albumName;
        if (mediaDataContainer.artistName !== mediaDataContainer.albumArtistName) {
            metaData.common.albumartist = mediaDataContainer.albumArtistName;
        }
        metaData.common.title = mediaDataContainer.titleName;
        metaData.common.track.no = mediaDataContainer.trackNr;
    };
    CommonDocMusicFileImportManager.prototype.mapMediaDocToMediaDataRecordToMediaDataContainer = function (mappings, mdoc, mediaDataContainer) {
        mediaDataContainer.genreName = mdoc.genre;
        mediaDataContainer.artistName = mdoc.artist;
        mediaDataContainer.albumName = mdoc.album;
        mediaDataContainer.albumArtistName = mdoc.albumArtist;
        mediaDataContainer.albumGenreName = mdoc.albumGenre;
        mediaDataContainer.titleName = mdoc.name;
        mediaDataContainer.trackNr = mdoc.trackNo;
    };
    CommonDocMusicFileImportManager.prototype.mapMediaDataRecordToAudioMetaDataToMediaDocRecord = function (mappings, mediaDataContainer, mdoc) {
        mdoc.genre = mediaDataContainer.genreName;
        mdoc.artist = mediaDataContainer.artistName;
        mdoc.album = mediaDataContainer.albumName;
        mdoc.albumArtist = mediaDataContainer.albumArtistName;
        mdoc.albumGenre = mediaDataContainer.albumGenreName;
        mdoc.name = mediaDataContainer.titleName;
        mdoc.trackNo = mediaDataContainer.trackNr;
    };
    CommonDocMusicFileImportManager.prototype.getFileExtensionToTypeMappings = function () {
        return {
            'mp3': 'AUDIO',
            'MP3': 'AUDIO',
            'jpg': 'AUDIOCOVER',
            'JPG': 'AUDIOCOVER'
        };
    };
    CommonDocMusicFileImportManager.prototype.getMimeTypeToFileExtension = function () {
        return {
            'audio/mp3': '.mp3',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif'
        };
    };
    return CommonDocMusicFileImportManager;
}());
exports.CommonDocMusicFileImportManager = CommonDocMusicFileImportManager;
//# sourceMappingURL=cdoc-musicfile-import.service.js.map