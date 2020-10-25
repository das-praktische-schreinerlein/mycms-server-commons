import {IAudioMetadata} from 'music-metadata';
import * as pathLib from 'path';
import {Mapper} from 'js-data';
import * as fs from 'fs';
import * as Promise_serial from 'promise-serial';
import * as readdirp from 'readdirp';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {GenericAdapterResponseMapper} from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import {BaseAudioRecord} from '@dps/mycms-commons/dist/search-commons/model/records/baseaudio-record';
import {BaseImageRecord} from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import {MediaManagerModule} from '../../media-commons/modules/media-manager.module';
import {
    BaseMusicMediaDocRecordReferencesType,
    BaseMusicMediaDocRecordType
} from '@dps/mycms-commons/dist/search-commons/model/records/basemusic-record';
import {NameUtils} from '@dps/mycms-commons/dist/commons/utils/name.utils';
import {FileUtils} from '@dps/mycms-commons/dist/commons/utils/file.utils';

export interface MediaImportRecordContainerType {
    [key: string]: BaseMusicMediaDocRecordType & BaseMusicMediaDocRecordReferencesType & CommonDocRecord;
}

export interface MediaImportFileContainerType {
    [key: string]: fs.Stats;
}

export interface MediaImportFileNameContainerType {
    [key: string]: string;
}

export interface MediaImportContainerType {
    FILES: MediaImportFileContainerType;
    ALBUMCOVERFILES: MediaImportFileNameContainerType;
    ARTIST: MediaImportRecordContainerType;
    AUDIO: MediaImportRecordContainerType;
    ALBUM: MediaImportRecordContainerType;
    ALBUMFOLDER: MediaImportRecordContainerType;
    GENRE: MediaImportRecordContainerType;
    GENREARTISTS: MediaImportRecordContainerType;
}

export interface MusicMediaDataContainerType {
    genreName: string;
    artistName: string;
    albumName: string;
    albumArtistName: string;
    albumGenreName: string;
    titleName: string;
    trackNr: number;
    releaseYear: string;
}

export abstract class CommonDocMusicFileImportManager<R extends BaseMusicMediaDocRecordType
    & BaseMusicMediaDocRecordReferencesType & CommonDocRecord> {
    public unknownGenre = 'Unbekanntes Genre';
    public unknownArtist = 'Unbekannter Artist';
    public unknownAlbum = 'Unbekanntes Album';

    protected readonly baseDir: string;

    protected constructor(baseDir: string, protected mediaManager: MediaManagerModule) {
        this.baseDir = baseDir;
    }

    public generateMusicDocRecordsFromMediaDir(mapper: Mapper, responseMapper: GenericAdapterResponseMapper,
                                               baseDir: string, mappings: {}): Promise<R[]> {
        const me = this;
        const normalizedMapping = JSON.parse(
            JSON.stringify(mappings).replace(/"([^"]+)":/g, function($0, $1) {
                const value = $1.toLocaleLowerCase();
                return ('"' + NameUtils.normalizeNames(value, value) + '":');
            }));
        const mediaTypes = this.getFileExtensionToTypeMappings();
        const fileExtensions = [
        ];
        for (const mediaType in mediaTypes) {
            if (!mediaTypes.hasOwnProperty(mediaType)) {
                continue;
            }

            fileExtensions.push('*.' + mediaType);
        }
        const settings = {
            root: baseDir,
            entryType: 'files',
            // Filter files with js and json extension
            fileFilter: fileExtensions,
            // Filter by directory
            directoryFilter: [ '!.git', '!*modules' ],
            // Work with files up to 1 subdirectory deep
            depth: 10
        };

        const container: MediaImportContainerType = {
            ALBUM: {},
            ARTIST: {},
            AUDIO: {},
            FILES: {},
            ALBUMCOVERFILES: {},
            ALBUMFOLDER: {},
            GENRE: {},
            GENREARTISTS: {}
        }
        const records: R[] = [];

        return new Promise<R[]>((allresolve, allreject) => {
            readdirp(settings, function fileCallBack(fileRes) {
                const path = fileRes['path'].replace(/\\/g, '/');
                const extension = pathLib.extname(path).replace('.', '');
                if (mediaTypes[extension] === undefined) {
                    console.warn('SKIP file - unknown extension', extension, path);
                    return;
                }

                if (container.FILES[path]) {
                    return;
                }
                container.FILES[path] = fileRes;
            }, function allCallBack(errors) {
                const funcs = [];
                for (const path in container.FILES) {
                    if (!container.FILES.hasOwnProperty(path)) {
                        continue;
                    }

                    console.warn('check path', path);
                    const extension = pathLib.extname(path).replace('.', '');
                    if (mediaTypes[extension] === 'AUDIO') {
                        funcs.push(function () {
                            return new Promise<string>((processorResolve) => {
                                me.mediaManager.readMusicTagsForMusicFile(baseDir + '/' + path).then(metaData => {
                                    me.createRecordsForMusicMetaData(mapper, responseMapper, path, records,
                                        container, container.FILES[path]['stat'], metaData, normalizedMapping)
                                    processorResolve(path);
                                }).catch(err => {
                                    console.error('error while reading file: ' + path, err);
                                    processorResolve(path);
                                });
                            });
                        });
                    } else if (mediaTypes[extension] === 'AUDIOCOVER') {
                        me.checkAndUpdateAlbumCover(container.ALBUMCOVERFILES, path);
                    } else {
                        console.warn('SKIP file - unknown mediaTypes', mediaTypes[extension], extension, path);
                    }
                }

                Promise_serial(funcs, {parallelize: 1}).then(() => {
                    return allresolve(records);
                }).catch(function errorSearch(reason) {
                    console.error('generateMediaDocRecordsFromMediaDir failed:', reason);
                    return allreject(reason);
                });

                if (errors) {
                    errors.forEach(function (err) {
                        return allreject(err);
                    });
                }
            });
        });
    }

    public createRecordsForData(mapper: Mapper, responseMapper: GenericAdapterResponseMapper, path: string, records: R[],
                                container: MediaImportContainerType, mediaDataContainer: MusicMediaDataContainerType,
                                fileStats: fs.Stats, metadata: IAudioMetadata): {} {
        const dir = pathLib.dirname(path);
        const coverFile = container.ALBUMCOVERFILES[dir];
        const values = {
        };

        const normalizedGenreName = NameUtils.normalizeNames(mediaDataContainer.genreName, this.unknownGenre);
        const normalizedGenreArtistName = 'VA_' + normalizedGenreName;
        const genreKey = NameUtils.normalizeTechnicalNames(normalizedGenreName);
        const genreArtistKey = NameUtils.normalizeTechnicalNames(normalizedGenreArtistName);
        let genre: R = <R>container.GENRE[genreKey];
        let genreArtist: R = <R>container.GENREARTISTS[genreKey];
        if (genre === undefined) {
            genre = <R><any>responseMapper.mapResponseDocument(mapper, {
                type_s: 'GENRE',
                id: 'GENRE_' + (records.length + 1),
                genre_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                name_s: normalizedGenreName,
                keywords_txt: ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName), 'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(genre);
            container.GENRE[genreKey] = genre;

            genreArtist = <R><any>responseMapper.mapResponseDocument(mapper, {
                type_s: 'ARTIST',
                id: 'ARTIST_' + (records.length + 1),
                genre_id_i: genre.genreId,
                artist_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                artist_txt: normalizedGenreArtistName,
                name_s: normalizedGenreArtistName,
                keywords_txt: ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName),
                    'Artist_' + NameUtils.normalizeKwNames(normalizedGenreArtistName),
                    'KW_Sampler', 'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(genreArtist);
            container.ARTIST[genreArtistKey] = genreArtist;
            container.GENREARTISTS[genreKey] = genreArtist;
        }
        values['genre_id_i'] = genre.genreId;

        const normalizedArtistName = NameUtils.normalizeNames(mediaDataContainer.artistName, this.unknownArtist);
        const artistKey = NameUtils.normalizeTechnicalNames(normalizedArtistName);
        let artist: R = <R>container.ARTIST[artistKey];
        if (artist === undefined) {
            artist = <R><any>responseMapper.mapResponseDocument(mapper, {
                type_s: 'ARTIST',
                id: 'ARTIST_' + (records.length + 1),
                genre_id_i: genre.genreId,
                artist_id_i: records.length + 1,
                genre_txt: normalizedGenreName,
                artist_txt: normalizedArtistName,
                name_s: normalizedArtistName,
                keywords_txt: ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName),
                    'Artist_' + NameUtils.normalizeKwNames(normalizedArtistName),
                    'KW_TODOKEYWORDS'].join(', ')
            }, {});
            records.push(artist);
            container.ARTIST[artistKey] = artist;
        }
        values['artist_id_i'] = artist.artistId;

        const normalizedAlbumArtistName = NameUtils.normalizeNames(mediaDataContainer.albumArtistName, normalizedArtistName)
        const normalizedAlbumName = NameUtils.normalizeNames(mediaDataContainer.albumName, this.unknownAlbum)
        const albumKey = NameUtils.normalizeTechnicalNames(normalizedAlbumArtistName + normalizedAlbumName + dir);
        const albumFolderKey = NameUtils.normalizeTechnicalNames(normalizedAlbumName + dir);
        let album: R = <R>container.ALBUM[albumKey];
        if (album === undefined) {
            const albumArtistKey = NameUtils.normalizeTechnicalNames(normalizedAlbumArtistName);
            let albumArtist: R = <R>container.ARTIST[albumArtistKey];
            if (albumArtist === undefined) {
                albumArtist = <R><any>responseMapper.mapResponseDocument(mapper, {
                    type_s: 'ARTIST',
                    id: 'ARTIST_' + (records.length + 1),
                    artist_id_i: records.length + 1,
                    genre_id_i: genre.genreId,
                    genre_txt: normalizedGenreName,
                    artist_txt: normalizedAlbumArtistName,
                    name_s: normalizedAlbumArtistName,
                    keywords_txt: ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName),
                        'Artist_' + NameUtils.normalizeKwNames(normalizedAlbumArtistName),
                        'KW_TODOKEYWORDS'].join(', ')
                }, {});
                records.push(albumArtist);
                container.ARTIST[albumArtistKey] = albumArtist;
            }

            album = <R>container.ALBUMFOLDER[albumFolderKey];
            if (album !== undefined) {
                if (album.artistId !== undefined && album.artistId !== genreArtist.artistId) {
                    this.appendLinkedArtistToAlbumRecord(mapper, album, album.artistId, album.artist);
                    album.artistId = genreArtist.artistId;
                    album.artist = genreArtist.name;
                    album.keywords = album.keywords + ', KW_Sampler';
                }

                this.appendLinkedArtistToAlbumRecord(mapper, album, albumArtist.artistId, albumArtist.name);
            } else {
                album = <R><any>responseMapper.mapResponseDocument(mapper, {
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
                    keywords_txt: ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName),
                        'Artist_' + NameUtils.normalizeKwNames(normalizedAlbumArtistName),
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
            }}, (key, value) => { if (value !== null) { return value }});
        values['data_tech_filesize_i'] = fileStats ? fileStats.size : undefined;
        values['data_tech_filecreated_dt'] = fileStats ? fileStats.mtime : undefined;
        values['data_tech_duration_i'] = metadata && metadata.format && metadata.format.duration
            ? parseFloat(metadata.format.duration.toString()).toFixed()
            : undefined;
        values['keywords_txt'] = ['Genre_' + NameUtils.normalizeKwNames(normalizedGenreName),
            'Artist_' + NameUtils.normalizeKwNames(normalizedAlbumArtistName),
            'KW_TODOKEYWORDS'].join(', ');
        const mdoc = <R><any>responseMapper.mapResponseDocument(mapper, values, {});
        records.push(mdoc);
        container.AUDIO[albumKey + mediaDataContainer.titleName] = mdoc;

        return values;
    }

    public extractAndSetCoverFile(mdoc: R, metaData: IAudioMetadata): Promise<boolean> {
        const mdocAudios = this.getAudiosFromRecord(mdoc);
        if (mdocAudios === undefined || mdocAudios.length <= 0) {
            return Promise.resolve(false);
        }

        const mdocImages = this.getImagesFromRecord(mdoc);
        if ((mdocImages !== undefined && mdocImages.length > 0)
            || metaData.common.picture === undefined || metaData.common.picture.length < 1) {
            return Promise.resolve(false);
        }

        const mdocAudio: BaseAudioRecord = mdocAudios[0];
        const destDir = pathLib.dirname(this.baseDir + '/' + mdocAudio.fileName);
        const coverFile = destDir + '/cover.jpg';
        const err = FileUtils.checkFilePath(coverFile, false,  false, false);
        if (err) {
            return Promise.reject('coverFile is invalid: ' + err);
        }
        if (fs.existsSync(coverFile)) {
            return Promise.resolve(false);
        }

        const mimes = this.getMimeTypeToFileExtension();
        const coverContainer = {};
        for (const picture of metaData.common.picture) {
            const ext = mimes[picture.format] || '.unknown';
            const fileName = destDir + '/' +
                ('extract-albumcover-' +
                    NameUtils.normalizeFileNames(mdoc.album) +
                    '-' +
                    NameUtils.normalizeFileNames(picture.type) +
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
    }

    public checkAndUpdateAlbumCover(container: {}, path: string) {
        const dir = pathLib.dirname(path);
        const fileNameBase = pathLib.parse(path).name;
        if (container[dir]) {
            if (fileNameBase.toLocaleLowerCase().endsWith('cover') || fileNameBase.toLocaleLowerCase().startsWith('cover')) {
                container[dir] = path;
            } else if (fileNameBase.toLocaleLowerCase().endsWith('large') || fileNameBase.toLocaleLowerCase().startsWith('large')) {
                container[dir] = path;
            } else if (fileNameBase.toLocaleLowerCase().endsWith('folder') || fileNameBase.toLocaleLowerCase().startsWith('folder')) {
                container[dir] = path;
            } else if (fileNameBase.toLocaleLowerCase().endsWith('front') || fileNameBase.toLocaleLowerCase().startsWith('front')) {
                container[dir] = path;
            }
        } else {
            container[dir] = path;
        }
    }

    public createRecordsForMusicMetaData(mapper: Mapper, responseMapper: GenericAdapterResponseMapper, path: string,
                                         records: R[], container: MediaImportContainerType,
                                         fileStats: fs.Stats, metaData: IAudioMetadata, mappings: {}): {} {
        const mediaDataContainer: MusicMediaDataContainerType = {
            genreName: undefined,
            albumArtistName: undefined,
            albumGenreName: undefined,
            albumName: undefined,
            artistName: undefined,
            titleName: undefined,
            trackNr: undefined,
            releaseYear: undefined
        }
        this.mapAudioMetaDataToMusicMediaData(mappings, path, metaData, mediaDataContainer);

        return this.createRecordsForData(mapper, responseMapper, path, records, container, mediaDataContainer, fileStats, metaData);
    }

    public mapAudioMetaDataToMusicMediaData(mappings: {}, path: string, metaData: IAudioMetadata,
                                            mediaDataContainer: MusicMediaDataContainerType): void {
        let genreName = NameUtils.normalizeNames(metaData.common.genre && metaData.common.genre[0].length > 0
            ? metaData.common.genre[0] : '', this.unknownGenre);
        genreName = genreName.replace(/&/g, 'N').replace(/[^-A-Za-z0-9_]+/g, '');
        genreName = NameUtils.normalizeNames(genreName, this.unknownGenre);
        genreName = NameUtils.remapData(mappings, 'genre', 'genre', genreName, genreName);

        let artistName = NameUtils.normalizeNames(metaData.common.artist,
            NameUtils.normalizeNames(metaData.common.albumartist, this.unknownArtist));
        genreName = NameUtils.remapData(mappings, 'artist', 'genre', artistName, genreName);
        artistName = NameUtils.remapData(mappings, 'artist', 'artist', artistName, artistName);

        let albumArtistName = NameUtils.normalizeNames(metaData.common.albumartist,
            NameUtils.normalizeNames(artistName, this.unknownArtist));
        if (artistName === this.unknownArtist || genreName === this.unknownGenre) {
            genreName = NameUtils.remapData(mappings, 'artist', 'genre', albumArtistName, genreName);
        }
        albumArtistName = NameUtils.remapData(mappings, 'artist', 'artist', albumArtistName, albumArtistName);

        let albumName = NameUtils.normalizeNames(metaData.common.album && metaData.common.album.length > 0
            ? metaData.common.album : '', this.unknownAlbum);
        genreName = NameUtils.remapData(mappings, 'album', 'genre', albumName, genreName);
        artistName = NameUtils.remapData(mappings, 'album', 'artist', albumName, artistName);
        albumArtistName = NameUtils.remapData(mappings, 'album', 'artist', albumName, albumArtistName);
        albumName = NameUtils.remapData(mappings, 'album', 'album', albumName, albumName);

        let titleName = NameUtils.normalizeNames(metaData.common.title && metaData.common.title.length > 0
            ? metaData.common.title : '', path);
        genreName = NameUtils.remapData(mappings, 'audio', 'genre', titleName, genreName);
        artistName = NameUtils.remapData(mappings, 'audio', 'artist', titleName, artistName);
        albumArtistName = NameUtils.remapData(mappings, 'audio', 'artist', titleName, albumArtistName);
        albumName = NameUtils.remapData(mappings, 'audio', 'album', titleName, albumName);
        titleName = NameUtils.remapData(mappings, 'audio', 'audio', titleName, titleName);

        const trackNr = metaData.common.track ? metaData.common.track.no : undefined;

        mediaDataContainer.genreName = genreName;
        mediaDataContainer.albumArtistName = albumArtistName;
        mediaDataContainer.albumName = albumName;
        mediaDataContainer.artistName = artistName;
        mediaDataContainer.titleName = titleName;
        mediaDataContainer.trackNr = trackNr;
        mediaDataContainer.releaseYear = undefined
    }

    public mapMediaDataContainerToAudioMetaData(mappings: {}, mediaDataContainer: MusicMediaDataContainerType,
                                                metaData: IAudioMetadata): void {
        if (!metaData.common) {
            metaData.common = {disk: {no: 0, of: 0}, track: {no: 0, of: 0}};
        }
        if (!metaData.common.track) {
            metaData.common.track = {no: 0, of: 0};
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
    }

    public mapMediaDocToMediaDataRecordToMediaDataContainer(mappings: {}, mdoc: R,
                                                            mediaDataContainer: MusicMediaDataContainerType): void {
        mediaDataContainer.genreName = mdoc.genre;
        mediaDataContainer.artistName = mdoc.artist
        mediaDataContainer.albumName = mdoc.album;
        mediaDataContainer.albumArtistName = mdoc.albumArtist;
        mediaDataContainer.albumGenreName = mdoc.albumGenre;
        mediaDataContainer.titleName = mdoc.name;
        mediaDataContainer.trackNr = mdoc.trackNo;
    }

    public mapMediaDataRecordToAudioMetaDataToMediaDocRecord(mappings: {}, mediaDataContainer: MusicMediaDataContainerType,
                                                             mdoc: R): void {
        mdoc.genre = mediaDataContainer.genreName;
        mdoc.artist = mediaDataContainer.artistName;
        mdoc.album = mediaDataContainer.albumName;
        mdoc.albumArtist = mediaDataContainer.albumArtistName;
        mdoc.albumGenre = mediaDataContainer.albumGenreName;
        mdoc.name = mediaDataContainer.titleName;
        mdoc.trackNo = mediaDataContainer.trackNr;
    }

    public getFileExtensionToTypeMappings(): {} {
        return {
            'mp3': 'AUDIO',
            'MP3': 'AUDIO',
            'jpg': 'AUDIOCOVER',
            'JPG': 'AUDIOCOVER'
        };
    }

    public getMimeTypeToFileExtension(): {} {
        return {
            'audio/mp3': '.mp3',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif'
        };
    }

    protected abstract appendCoverImageToRecord(mdoc: R, coverFile: string);
    protected abstract appendLinkedArtistToAlbumRecord(mapper: Mapper, mdoc: R, artistId: number, artistName: string);
    protected abstract getAudiosFromRecord(mdoc: R): BaseAudioRecord[];
    protected abstract getImagesFromRecord(mdoc: R): BaseImageRecord[];
}
