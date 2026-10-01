import type { FC } from 'hono/jsx';
import type { Achievement } from '../../domain/achievements.js';
import { Icon } from '../icons.js';

/** Conquistas (§4.2): bloqueadas em cinza; carrossel horizontal no mobile. */
export const Achievements: FC<{ achievements: Achievement[] }> = ({ achievements }) => (
  <section class="achievements" aria-labelledby="conquistas">
    <h2 class="eyebrow" id="conquistas">
      Conquistas
    </h2>
    <ul class="achievement-list">
      {achievements.map((achievement) => (
        <li class={`achievement tone-${achievement.color}${achievement.unlocked ? '' : ' locked'}`}>
          <span class="badge-icon">
            <Icon name={achievement.icon} />
          </span>
          <span class="title">{achievement.title}</span>
          <span class="detail">{achievement.detail}</span>
          {!achievement.unlocked && <span class="sr-only">(bloqueada)</span>}
        </li>
      ))}
    </ul>
  </section>
);
