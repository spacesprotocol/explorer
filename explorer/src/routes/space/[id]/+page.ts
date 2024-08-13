import { error, type Actions, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch, locals, params }) => {
    const spaceName = params.id;
    const [space, blockStats] = await Promise.all([
        fetch(`/api/spaces/${spaceName}`).then(x => x.body ? x.json() : null),
        fetch('/api/blocks/stats').then(x => x.json())
    ]);

    if (space.error && space.error != "Space not found") {
        console.error(space.error);
        return error(404, { message: "An error occurred" });
    }

    return { space, blockStats };
};