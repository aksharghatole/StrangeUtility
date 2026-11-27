export function launchLinks(registry) {
  if (!Array.isArray(registry)) return [];

  return registry.flatMap((app) => {
    if (!app || typeof app.id !== 'string' || typeof app.name !== 'string' || app.status === 'queued') return [];

    const rawDescription = typeof app.description === 'string' ? app.description.trim() : '';
    const description = rawDescription.length > 140 ? `${rawDescription.slice(0, 137).trimEnd()}…` : rawDescription;

    if (typeof app.path === 'string' && app.path === `apps/${app.id}/`) {
      return [{ name: app.name, description: description || 'Open this app.', href: app.path }];
    }

    if (typeof app.existingUrl === 'string') {
      try {
        const url = new URL(app.existingUrl);
        if (url.protocol === 'https:') return [{ name: app.name, description: description || 'Open this app.', href: url.href }];
      } catch {
        // Invalid or unsafe destinations are not app launch links.
      }
    }

    return [];
  });
}

async function renderPortal() {
  const list = document.querySelector('#apps');
  const message = document.querySelector('#message');

  try {
    const response = await fetch(new URL('../registry.json', import.meta.url));
    if (!response.ok) throw new Error('Registry unavailable');

    const links = launchLinks(await response.json());
    const fragment = document.createDocumentFragment();
    for (const app of links) {
      const card = document.createElement('article');
      card.className = 'app-card';
      const link = document.createElement('a');
      link.className = 'launch-link';
      link.href = app.href;
      link.textContent = app.name;

      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      link.append(arrow);

      const description = document.createElement('p');
      description.className = 'app-description';
      description.textContent = app.description;

      card.append(link, description);
      fragment.append(card);
    }

    if (links.length === 0) throw new Error('No app launch links are available.');
    list.replaceChildren(fragment);
  } catch {
    message.hidden = false;
    message.textContent = 'Could not load the app launch links. Reload the page or check the server.';
  }
}

if (typeof document !== 'undefined') renderPortal();
