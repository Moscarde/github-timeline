import { viewText } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import type { Achievement } from '../../domain/achievements.js';

/** Conquistas (§4.2): bloqueadas em cinza; carrossel horizontal no celular. */
export const Achievements: FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  return (
    <section class="sec achievements" aria-labelledby="conquistas">
      <div class="wrap">
        <div class="sec-head">
          <h2 class="h2" id="conquistas">
            {viewText('Conquistas')}
          </h2>
          <span class="muted sec-note">
            {unlocked}
            {viewText(' de ')}
            {achievements.length}
            <span class="desktop-only">{viewText(' desbloqueadas')}</span>
            <span class="mobile-only">{viewText(' · deslize →')}</span>
          </span>
        </div>
        <ul class="achievement-list">
          {achievements.map((achievement) => (
            <li class={achievementClass(achievement)}>
              <span class="disc mono" aria-hidden="true">
                {achievement.mark}
              </span>
              <span class="title">{achievement.title}</span>
              <span class="detail muted">{achievement.detail}</span>
              {!achievement.unlocked && <span class="sr-only">{viewText('(bloqueada)')}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

function achievementClass(achievement: Achievement): string {
  return achievement.unlocked ? `achievement tone-${achievement.tone}` : 'achievement locked';
}
