import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { readJsonFromFileOrStdin } from '../../../utils/files';

export default class GeoBriefsCreate extends NotraCommand {
  static override description = 'Research a topic and create a GEO content brief.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the request body from a JSON file (or "-" for stdin).',
      exclusive: [
        'topic',
        'auto-approve',
        'content-subtype',
        'brand-voice',
        'competitor',
        'sitemap-id',
        'source-kind',
        'source-id',
      ],
    }),
    topic: Flags.string({ description: 'Topic the article should target.' }),
    'auto-approve': Flags.boolean({ description: 'Start the writer after planning.' }),
    'content-subtype': Flags.string({
      description: 'Blog post subtype.',
      options: ['guide', 'comparison', 'listicle', 'how-to', 'faq', 'alternatives'],
    }),
    'brand-voice': Flags.string({ description: 'Brand voice ID. Repeatable.', multiple: true }),
    competitor: Flags.string({ description: 'Competitor ID. Repeatable.', multiple: true }),
    'sitemap-id': Flags.string({ description: 'Sitemap ID.' }),
    'source-kind': Flags.string({
      description: 'Brief source kind.',
      options: ['manual', 'gap', 'prompt', 'search_console'],
    }),
    'source-id': Flags.string({ description: 'Gap, prompt, or Search Console suggestion ID.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoBriefsCreate);
    if (!flags['config-file'] && !flags.topic) {
      this.error('--topic is required when --config-file is not used.');
    }

    const body = flags['config-file']
      ? await readJsonFromFileOrStdin(
          flags['config-file'],
          'Expected brief JSON via --config-file or piped on stdin.',
        )
      : {
          topic: flags.topic,
          autoApprove: flags['auto-approve'],
          contentSubtype: flags['content-subtype'],
          brandVoiceIds: flags['brand-voice'],
          competitorIds: flags.competitor,
          sitemapId: flags['sitemap-id'],
          sourceKind: flags['source-kind'],
          sourceId: flags['source-id'],
        };
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/briefs`,
      { body, timeoutMs: 255_000 },
    );
    this.printJson(response);
  }
}
