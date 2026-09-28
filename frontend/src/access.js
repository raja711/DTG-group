export function hasPermission(user, module, action = "view") {
  if (user?.role?.name === "Administrator") return true;
  return Boolean(user?.role?.permissions?.some(permission => permission.module === module && permission[action]));
}
