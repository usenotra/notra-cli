import { createApiCommand } from '../../cli/api-command';
import { patchSkillRequestSchema } from '../../schemas/skills';

export default createApiCommand('patchSkill', { bodySchema: patchSkillRequestSchema });
