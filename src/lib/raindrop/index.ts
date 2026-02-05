/**
 * See API spec at https://developer.raindrop.io/
 *
 * Uses \@lasuillard/raindrop-client package for API interactions.
 */
import { getClient } from './client';

export { createTreeFromRaindrops, RaindropNodeData } from './sync';

export default getClient();
