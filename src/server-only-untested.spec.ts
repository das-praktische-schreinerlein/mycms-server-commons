// import untested service for code-coverage
import {ServerLogUtils} from './server-commons/serverlog.utils';
import {CommonMediaManagerCommand} from './backend-commons/commands/common-media-manager.command';
import {CommonDocPlaylistServerModule} from './backend-commons/modules/cdoc-playlist-server.module';
import {CommonDocServerModule} from './backend-commons/modules/cdoc-server.module';
import {CommonDocTransportModule} from './backend-commons/modules/cdoc-transport.module';
import {CommonDocWriterServerModule} from './backend-commons/modules/cdoc-writer-server.module';
import {RedirectGeneratorModule} from './backend-commons/modules/redirect-generator.module';
import {SitemapGeneratorModule} from './backend-commons/modules/sitemap-generator.module';
import {MediaManagerModule} from './media-commons/modules/media-manager.module';
import {ConfigureServerModule} from './server-commons/configure-server.module';
import {DataCacheModule} from './server-commons/datacache.module';
import {DnsBLModule} from './server-commons/dnsbl.module';
import {FirewallCommons} from './server-commons/firewall.commons';
import {GenericDnsBLModule} from './server-commons/generic-dnsbl.module';

for (const a in [
    ServerLogUtils,
    CommonMediaManagerCommand,
    CommonDocPlaylistServerModule,
    CommonDocServerModule,
    CommonDocTransportModule,
    CommonDocWriterServerModule,
    RedirectGeneratorModule,
    SitemapGeneratorModule,
    MediaManagerModule,
    ConfigureServerModule,
    DataCacheModule,
    DnsBLModule,
    FirewallCommons,
    GenericDnsBLModule
]) {
    console.log('import unused modules for codecoverage');
}

describe('Dummy-Test', () => {
    it('should be true', () => {
        expect(true).toBeTruthy();
    });
});
