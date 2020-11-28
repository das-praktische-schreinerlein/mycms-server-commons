# MyCMS-Server-Commons

MyCMS is a library for developing CMS-applications.
It's the software-stack behind the new portal-version [www.michas-ausflugstipps.de](https://www.michas-ausflugstipps.de/). 

For more information take a look at documentation:
- [changelog](docs/CHANGELOG.md) 
- [credits for used libraries](docs/CREDITS.md)

MyCMS-Server-Commons contains the services+utils for the server-part of an application as server and cli.

Some amazing Features
- cli-skeleton
- several plugin-modules for express: firewalls, serverlogging, dns-block, cache
- support for media-management as convert, scale, rotate, video-thumbs...  for image, video, mp3
- CommonDoc-api-server with several modules and cli-commands
    - rest-api: search + show, CRUD
    - sitemap-generator
    - redirect-generator
    - playlist-server
    - dump export/import-server
    - convert media-files (image, video, mp3) to CommonDoc-import-records
