import { llm } from '../lib/ollama.js';

export async function groupCoordinatorAgent(cartItems, groupSize, newUserName) {
  if (newUserName) {
    const existingItems = cartItems.map(i => i.menuItem?.name).join(', ');
    return {
      message: `Hey ${newUserName}! ${cartItems.length > 0 ? `The group already has ${existingItems} in the cart. Want to browse and add more?` : "You're the first one here! Start exploring the menu."}`
    };
  }

  if (groupSize && groupSize > 1) {
    return {
      message: `For a group of ${groupSize}, I'd suggest a mix! Let me find some great sharing platters and crowd-pleasers.`,
      filterHint: 'shareable'
    };
  }

  return null;
}