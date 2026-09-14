export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: { page: number; limit: number; category?: number; search?: string }) =>
    [...productKeys.lists(), filters] as const,
  categories: () => [...productKeys.all, "categories"] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  likes: (id: number) => [...productKeys.detail(id), "likes"] as const,
  comments: (id: number, page = 1) => [...productKeys.detail(id), "comments", page] as const,
};

export const shopKeys = {
  all: ["shops"] as const,
  lists: () => [...shopKeys.all, "list"] as const,
  list: () => [...shopKeys.lists()] as const,
  details: () => [...shopKeys.all, "detail"] as const,
  detail: (id: number) => [...shopKeys.details(), id] as const,
  products: (id: number) => [...shopKeys.detail(id), "products"] as const,
  merchant: (id: number) => [...shopKeys.detail(id), "merchant"] as const,
  mine: () => [...shopKeys.all, "mine"] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: () => [...orderKeys.lists(), "mine"] as const,
  merchant: () => [...orderKeys.lists(), "merchant"] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  feedback: (id: number) => [...orderKeys.detail(id), "feedback"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  detail: (id: number | string) => [...userKeys.all, "detail", id] as const,
  followers: (id: number) => [...userKeys.detail(id), "followers"] as const,
  following: (id: number) => [...userKeys.detail(id), "following"] as const,
  followStatus: (id: number) => [...userKeys.detail(id), "follow-status"] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  inbox: () => [...messageKeys.all, "inbox"] as const,
  conversation: (partnerId: number) => [...messageKeys.all, "conversation", partnerId] as const,
  unread: () => [...messageKeys.all, "unread"] as const,
};
