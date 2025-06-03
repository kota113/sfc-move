import {getCurrentUser, supabase} from "./supabase";

export const isUserRegistered = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) {
    console.error('User not authenticated');
    return false;
  }
  const {data, error} = await supabase
    .from('public_user')
    .select('*')
    .eq('id', user.id)
    .single();
  if (!data || error) {
    console.error('User data not found: ', error);
    return false;
  }
  return true;
}

export const registerUser = async (email: string, name: string) => {
  const user = await getCurrentUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }
  const {error} = await supabase
    .from('users')
    .insert({
      id: user.id,
      full_name: name,
      email: email
    });
  if (error) {
    console.error(error);
    return null;
  }
}
