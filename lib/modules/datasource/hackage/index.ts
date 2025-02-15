import is from '@sindresorhus/is';
import { joinUrlParts } from '../../../util/url';
import * as pvpVersioning from '../../versioning/pvp';
import { Datasource } from '../datasource';
import type { GetReleasesConfig, Release, ReleaseResult } from '../types';
import { HackagePackageMetadata } from './schema';

export class HackageDatasource extends Datasource {
  static readonly id = 'hackage';

  constructor() {
    super(HackageDatasource.id);
  }

  override readonly defaultVersioning = pvpVersioning.id;
  override readonly customRegistrySupport = false;
  override readonly defaultRegistryUrls = ['https://hackage.haskell.org/'];

  async getReleases(config: GetReleasesConfig): Promise<ReleaseResult | null> {
    const { registryUrl, packageName } = config;
    if (!is.nonEmptyString(registryUrl)) {
      return null;
    }
    const massagedPackageName = encodeURIComponent(packageName);
    const url = joinUrlParts(
      registryUrl,
      'package',
      `${massagedPackageName}.json`,
    );
    const res = await this.http.getJson(url, HackagePackageMetadata);
    const releases = [];
    for (const [version, versionStatus] of Object.entries(res.body)) {
      const isDeprecated = versionStatus === 'deprecated';
      releases.push(
        versionToRelease(version, packageName, registryUrl, isDeprecated),
      );
    }
    return { releases };
  }
}

export function versionToRelease(
  version: string,
  packageName: string,
  registryUrl: string,
  isDeprecated: boolean,
): Release {
  return {
    version,
    changelogUrl: joinUrlParts(
      registryUrl,
      'package',
      `${packageName}-${version}`,
      'changelog',
    ),
    isDeprecated,
  };
}
