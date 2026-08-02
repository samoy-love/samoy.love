// Счётчики событий интерфейса.
//
// Что уходит на сервер: пустой POST на /e/<имя события>. Ни тела, ни
// параметров, ни cookie, ни идентификатора — ни сессии, ни посетителя.
// Сервер отвечает 204 и пишет строку вида
//
//     samoy.love "POST /e/project_open HTTP/2.0" 204 0 0.000
//
// IP и User-Agent в этом журнале отсутствуют физически: их нет в log_format.
// Связать два события одного человека не по чему.
//
// Список имён закрыт и на сервере (nginxlog.yml в metrics.samoy.love):
// незнакомое сворачивается в один ряд "other". Добавляя событие сюда,
// добавьте его и там.

export const SITE_EVENTS = ['project_open', 'contact_open', 'source_open'] as const;

export type SiteEvent = (typeof SITE_EVENTS)[number];

/**
 * Отправить событие. Никогда не бросает: счётчик не стоит того, чтобы из-за
 * него не открылась ссылка.
 *
 * sendBeacon, а не fetch: браузер доставляет его сам и переживает уход со
 * страницы. Именно это здесь и нужно — почти все события ниже сопровождают
 * переход по ссылке, то есть выгрузку документа.
 */
export function trackEvent(event: SiteEvent): void {
  if (typeof navigator === 'undefined') return;

  const url = `/e/${event}`;

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([], { type: 'text/plain' }));
      return;
    }
    if (typeof fetch === 'function') {
      void fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  } catch {
    // Блокировщик, офлайн — событие теряется молча.
  }
}

const isSiteEvent = (value: string): value is SiteEvent =>
  (SITE_EVENTS as readonly string[]).includes(value);

/**
 * Один слушатель на документ вместо слушателя на каждой ссылке: разметка
 * статическая, ссылок десятки, и вешать на каждую свой обработчик — лишняя
 * работа при загрузке ради события, которое случается раз в сеанс.
 *
 * Событие берётся из data-event у ближайшего предка клика, поэтому подписать
 * новую ссылку можно одним атрибутом, не трогая этот файл.
 */
export function initEventTracking(root: ParentNode = document): void {
  root.addEventListener('click', (e) => {
    const target = (e.target as Element | null)?.closest<HTMLElement>('[data-event]');
    if (!target) return;

    const name = target.dataset.event;
    if (!name || !isSiteEvent(name)) return;

    trackEvent(name);
  });
}
