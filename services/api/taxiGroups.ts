import {getCurrentUser, supabase} from './supabase';

// Type for taxi group with additional fields needed for the UI
export interface TaxiGroup {
  id: string;
  createdAt: Date;
  completedAt: Date;
  hostId: string;
  hostName: string | null;
  memo: string | null;
  peopleCount: number;
  maxPeople: number;
  isUserMember: boolean;
  isUserHost: boolean;
  depFrom: "station" | "sfc";
}

// Maximum people per taxi
export const MAX_PEOPLE_PER_TAXI = 4;

// Function to fetch all active taxi groups
export const fetchTaxiGroups = async (): Promise<TaxiGroup[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return [];
    }

    // Get all active taxi groups
    const {data: taxiGroups, error: groupsError} = await supabase
      .from('taxi_groups')
      .select('*')
      .is('completed_at', null);

    if (!taxiGroups) return [];
    if (groupsError) {
      console.error('Error fetching taxi groups:', groupsError);
      return [];
    }

    // Get all memberships to calculate people count and check if user is a member
    const {data: memberships, error: membershipsError} = await supabase
      .from('taxi_group_members')
      .select('*');

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      return [];
    }
    if (!memberships) return [];

    // Get host information from public_user view
    const hostIds = taxiGroups.map(group => group.host_id);
    const {data: hostUsers, error: hostUsersError} = await supabase
      .from('public_user')
      .select('id, full_name')
      .in('id', hostIds);

    if (hostUsersError) {
      console.error('Error fetching host users:', hostUsersError);
      // Continue without host names if there's an error
    }

    // Transform the data to match the TaxiGroup interface
    return taxiGroups.map(group => {
      const groupMembers = memberships.filter(m => m.group_id === group.id);
      const isUserMember = groupMembers.some(m => m.user_id === user.id);

      // Find the host's name
      const hostUser = hostUsers?.find(user => user.id === group.host_id);
      const hostName = hostUser?.full_name || null;

      return {
        id: group.id,
        createdAt: new Date(group.created_at),
        completedAt: group.completed_at ? new Date(group.completed_at) : new Date(),
        hostId: group.host_id,
        hostName,
        memo: group.memo,
        peopleCount: groupMembers.length,
        maxPeople: MAX_PEOPLE_PER_TAXI,
        isUserMember,
        isUserHost: group.host_id === user.id,
        depFrom: group.dep_from
      };
    });
  } catch (error) {
    console.error('Error fetching taxi groups:', error);
    return [];
  }
};

// Function to create a new taxi group
export const createTaxiGroup = async (peopleCount: number, memo: string = '', depFrom: "station" | "sfc"): Promise<TaxiGroup | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    // Create a new taxi group
    const {data: newGroup, error: groupError} = await supabase
      .from('taxi_groups')
      .insert({
        host_id: user.id,
        memo: memo || null,
        completed_at: null,
        dep_from: depFrom
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating taxi group:', groupError);
      return null;
    }
    if (!newGroup) return null;

    // Add the creator as a member
    const {error: memberError} = await supabase
      .from('taxi_group_members')
      .insert({
        group_id: newGroup.id,
        user_id: user.id
      });

    if (memberError) {
      console.error('Error adding user as member:', memberError);
      return null;
    }

    // Get the user's name from public_user view
    const {data: hostUser, error: hostUserError} = await supabase
      .from('public_user')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (hostUserError) {
      console.error('Error fetching host user:', hostUserError);
      // Continue without host name if there's an error
    }

    // Return the new group with the TaxiGroup interface
    return {
      id: newGroup.id,
      createdAt: new Date(newGroup.created_at),
      completedAt: newGroup.completed_at ? new Date(newGroup.completed_at) : new Date(),
      hostId: newGroup.host_id,
      hostName: hostUser?.full_name || null,
      memo: newGroup.memo,
      peopleCount: 1, // Start with 1 (the creator)
      maxPeople: MAX_PEOPLE_PER_TAXI,
      isUserMember: true,
      isUserHost: true, // The creator is always the host
      depFrom: newGroup.dep_from
    };
  } catch (error) {
    console.error('Error creating taxi group:', error);
    return null;
  }
};

// Function to join a taxi group
export const joinTaxiGroup = async (groupId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    // Check if the user is already a member of any group
    const {data: existingMemberships, error: membershipError} = await supabase
      .from('taxi_group_members')
      .select('*')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Error checking existing memberships:', membershipError);
      return false;
    }

    // If user is already a member of any group, don't allow joining another
    if (existingMemberships && existingMemberships.length > 0) {
      console.log('User is already a member of a taxi group');
      return false;
    }

    // Check if the group is full
    const {data: groupMembers, error: membersError} = await supabase
      .from('taxi_group_members')
      .select('*')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error checking group members:', membersError);
      return false;
    }

    // Don't allow joining if the group is full
    if (groupMembers && groupMembers.length >= MAX_PEOPLE_PER_TAXI) {
      console.log('Taxi group is full');
      return false;
    }

    // Add the user as a member
    const {error: joinError} = await supabase
      .from('taxi_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id
      });

    if (joinError) {
      console.error('Error joining taxi group:', joinError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error joining taxi group:', error);
    return false;
  }
};

// Function to leave a taxi group
export const leaveTaxiGroup = async (groupId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    // Remove the user from the group
    const {error} = await supabase
      .from('taxi_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving taxi group:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error leaving taxi group:', error);
    return false;
  }
};

// Function to mark a taxi group as completed
export const markTaxiGroupAsCompleted = async (groupId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    // Check if the user is the host of the group
    const {data: group, error: groupError} = await supabase
      .from('taxi_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error getting taxi group:', groupError);
      return false;
    }
    if (!group) return false;

    // Only the host can mark the group as completed
    if (group.host_id !== user.id) {
      console.log('Only the host can mark the group as completed');
      return false;
    }

    // Mark the group as completed
    const {error: updateError} = await supabase.rpc('mark_taxi_group_as_completed', {
      p_group_id: groupId,
    })

    if (updateError) {
      console.error('Error marking taxi group as completed:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking taxi group as completed:', error);
    return false;
  }
};

// Function to get the user's current taxi group
export const getUserTaxiGroup = async (): Promise<TaxiGroup | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    // Get the user's membership
    const {data: membership, error: membershipError} = await supabase
      .from('taxi_group_members')
      .select('*')
      .eq('user_id', user.id);

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        // No membership found
        return null;
      }
      console.error('Error getting user membership:', membershipError);
      return null;
    }

    if (!membership) return null;

    // Get the group details
    const {data: group, error: groupError} = await supabase
      .from('taxi_groups')
      .select('*')
      .in('id', membership.map(m => m.group_id))
      .single();

    if (!group) return null;
    if (groupError) {
      console.error('Error getting taxi group details:', groupError);
      return null;
    }

    // Get all members of the group
    const {data: members, error: membersError} = await supabase
      .from('taxi_group_members')
      .select('*')
      .eq('group_id', group.id);

    if (membersError) {
      console.error('Error getting taxi group members:', membersError);
      return null;
    }

    // Get host information from public_user view
    const {data: hostUser, error: hostUserError} = await supabase
      .from('public_user')
      .select('full_name')
      .eq('id', group.host_id)
      .single();

    if (hostUserError) {
      console.error('Error fetching host user:', hostUserError);
      // Continue without host name if there's an error
    }

    // Return the group with the TaxiGroup interface
    return {
      id: group.id,
      createdAt: new Date(group.created_at),
      completedAt: group.completed_at ? new Date(group.completed_at) : new Date(),
      hostId: group.host_id,
      hostName: hostUser?.full_name || null,
      memo: group.memo,
      peopleCount: members ? members.length : 0,
      maxPeople: MAX_PEOPLE_PER_TAXI,
      isUserMember: true,
      isUserHost: group.host_id === user.id,
      depFrom: group.dep_from
    };
  } catch (error) {
    console.error('Error getting user taxi group:', error);
    return null;
  }
};
