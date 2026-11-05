let prepareReload;

export function setPrepareHubReload(prepare) {
  prepareReload = prepare;
}

// Keep the update waiting until the workspace has run its save/close checks.
export async function prepareHubReload() {
  return prepareReload ? await prepareReload() : false;
}
