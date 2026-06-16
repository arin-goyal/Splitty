import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Image,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Line, Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import AddExpenseFloatingButton from '../../components/AddExpenseFloatingButton';
import { useAppStore } from '../../store/appStore';
import { useFriendStore } from '../../store/friendStore';
import { useAuthStore } from '../../store/authStore';
import { Group, User } from '../../types';
import GroupListItem from '../../components/GroupListItem';
import FriendListItem from '../../components/FriendListItem';
import CreateGroupModal from '../../components/CreateGroupModal';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const ArrowIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#B1CDC1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2 }}>
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

const LeaveIcon = ({ color = '#FF3B30' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const EditIcon = ({ color = '#DBE8E3' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
);

const DeleteIcon = ({ color = '#FF3B30' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

const RemoveFriendIcon = ({ color = '#FF3B30' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Line x1="17" y1="8" x2="23" y2="14" />
    <Line x1="23" y1="8" x2="17" y2="14" />
  </Svg>
);

function InactiveHeart() {
  return (
    <Svg width={22.5} height={20} viewBox="0 0 18 16" fill="none">
      <Path
        d="M13.1938 0C15.8167 0 17.9733 2.10501 18.0005 4.69336C18.0239 6.95208 17.1941 9.03759 15.4643 11.0684L15.1265 11.4531C14.2541 12.4136 12.7548 13.8237 9.77977 15.7686C9.55018 15.9193 9.27832 15.9999 9.00048 16L8.79344 15.9844C8.58927 15.9544 8.3932 15.9999 8.79344 15.9844C8.58927 15.9544 8.3932 15.8807 8.22118 15.7676C5.24598 13.8225 3.74679 12.4126 2.8745 11.4521L2.53661 11.0684C0.806063 9.03722 -0.0227836 6.95153 0.000476057 4.69336C0.027721 2.10545 2.18425 0 4.80712 0L5.1577 0.0117188C6.87716 0.128507 8.08297 1.08866 8.80419 1.89648C8.8286 1.92353 8.85927 1.94511 8.89305 1.95996C8.91001 1.96735 8.92771 1.97281 8.94579 1.97656L9.00048 1.98242C9.01892 1.98242 9.03723 1.98029 9.05516 1.97656L9.1079 1.95996C9.12475 1.95255 9.14097 1.94324 9.15575 1.93262L9.19676 1.89648C9.96604 1.03402 11.2867 2.4123e-05 13.1938 0ZM13.1938 1.2998C11.7991 1.29983 10.8026 2.04852 10.1665 2.76172L10.0444 2.88379C9.92034 2.99492 9.78057 3.0848 9.63134 3.15039H9.62938C9.43089 3.23729 9.21676 3.28223 9.00048 3.28223C8.78384 3.28223 8.56959 3.23701 8.37157 3.15039H8.36962C8.16962 3.06249 7.98827 2.93254 7.83934 2.76758L7.83446 2.76172C7.19772 2.04862 6.20138 1.29983 4.80712 1.2998C2.88057 1.2998 1.32083 2.84792 1.30126 4.70703C1.28186 6.59669 1.96049 8.38718 3.52587 10.2246C4.20525 11.0218 5.45767 12.3408 8.33544 14.2832L8.93309 14.6797L8.93602 14.6816C8.95101 14.6915 8.97349 14.6989 9.00048 14.6992C9.0277 14.6991 9.0507 14.6916 9.06591 14.6816L9.06786 14.6807C12.3729 12.5201 13.7493 11.076 14.4741 10.2256L14.7573 9.88086C16.1215 8.1632 16.718 6.47899 16.6997 4.70703C16.6801 2.84744 15.1203 1.2998 13.1938 1.2998Z"
        fill="#7E9A8E"
      />
    </Svg>
  );
}

function ActiveHeart() {
  return (
    <Svg width={21.17} height={20} viewBox="0 0 18 17" fill="none">
      <Path
        d="M13.0005 2.5C13.0005 3.88071 14.1198 5 15.5005 5C15.8771 5 16.2343 4.9167 16.5547 4.76752C17.4086 4.36986 18.0005 3.50405 18.0005 2.5C18.0005 1.11929 16.8812 0 15.5005 0C14.1856 0 13.1079 1.01505 13.008 2.30428C13.003 2.36886 13.0005 2.43413 13.0005 2.5Z"
        fill="#00EE87"
      />
      <Path
        d="M18.0005 5.69336C18.0239 7.95208 17.1941 10.0376 15.4643 12.0684L15.1265 12.4531C14.2541 13.4136 12.7548 14.8237 9.77977 16.7686C9.55018 16.9193 9.27832 16.9999 9.00048 17L8.79344 16.9844C8.58927 16.9544 8.3932 16.8807 8.22118 16.7676C5.24598 14.8225 3.74679 13.4126 2.8745 12.4521L2.53661 12.0684C0.806063 10.0372 -0.0227836 6.95153 0.000476058 5.69336C0.027721 3.10545 2.18425 1 4.80712 1L5.1577 1.01172C6.87716 1.12851 8.08297 2.08866 8.80419 2.89648C8.8286 2.92353 8.85927 2.94511 8.89305 2.95996C8.91001 2.96735 8.92771 2.97281 8.94579 2.97656L9.00048 2.98242C9.01892 2.98242 9.03723 2.98029 9.05516 2.97656L9.1079 2.95996C9.12475 2.95255 9.14097 2.94324 9.15575 2.93262L9.19676 2.89648C9.78514 2.23684 10.696 1.47685 11.9452 1.15588C11.7872 1.57374 11.7007 2.02676 11.7007 2.5C11.7007 2.53743 11.7012 2.57473 11.7023 2.6119C11.0561 2.89609 10.5469 3.33525 10.1665 3.76172L10.0444 3.88379C9.92034 3.99492 9.78057 4.0848 9.63134 4.15039H9.62938C9.43089 4.23729 9.21676 4.28223 9.00048 4.28223C8.78384 4.28223 8.56959 4.23701 8.37157 4.15039H8.36962C8.16962 3.06249 7.98827 3.93254 7.83934 3.76758L7.83446 3.76172C7.19772 3.04862 6.20138 2.29983 4.80712 2.2998C2.88057 2.2998 1.32083 3.84792 1.30126 5.70703C1.28186 7.59669 1.96049 8.38718 3.52587 11.2246C4.20525 12.0218 5.45767 13.3408 8.33544 15.2832L8.93309 15.6797L8.93602 15.6816C8.95101 15.6915 8.97349 15.6989 9.00048 15.6992C9.0277 15.6991 9.0507 15.6916 9.06591 15.6816L9.06786 14.6807C12.3729 12.5201 13.7493 12.076 14.4741 11.2256L14.7573 10.8809C16.018 9.29352 16.6231 7.73474 16.6932 6.10887C17.1738 5.95012 17.612 5.69805 17.9862 5.37409C17.9946 5.47961 17.9993 5.58607 18.0005 5.69336Z"
        fill="#B1CDC1"
      />
    </Svg>
  );
}

function AddFriendIcon() {
  return (
    <Svg width={22.5} height={20} viewBox="0 0 18 16" fill="none">
      <Path
        d="M10.1995 7.99987C12.1791 7.99987 13.9282 6.22456 14.0995 4.04209C14.1846 2.94567 13.8235 1.92318 13.0825 1.16355C12.3494 0.413207 11.3245 0 10.1995 0C9.06555 0 8.03995 0.410708 7.31206 1.15641C6.57593 1.91033 6.21705 2.93496 6.29957 4.04136C6.46793 6.22418 8.21655 7.99987 10.1995 7.99987Z"
        fill="#B1CDC1"
      />
      <Path
        d="M17.9767 14.5627C17.6602 12.8906 16.6721 11.486 15.1196 10.5003C13.7408 9.62497 11.9936 9.14284 10.2 9.14284C8.40639 9.14284 6.65929 9.62497 5.2804 10.5C3.72791 11.4857 2.73979 12.8903 2.42329 14.5624C2.35092 14.9456 2.44916 15.3245 2.69291 15.602C2.80347 15.7285 2.94229 15.8298 3.09923 15.8987C3.25618 15.9675 3.42727 16.0021 3.60007 15.9999H16.8C16.9728 16.0022 17.1441 15.9677 17.3011 15.899C17.4582 15.8302 17.5971 15.7289 17.7079 15.6024C17.9509 15.3249 18.0491 14.9459 17.9767 14.5627Z"
        fill="#B1CDC1"
      />
      <Path
        d="M3.29952 9.14215V7.71377H4.79932C4.9584 7.71377 5.111 7.65358 5.22352 7.54646C5.336 7.4393 5.3992 7.29397 5.3992 7.14246C5.3992 6.99096 5.336 6.84559 5.22352 6.73842C5.111 6.6313 4.9584 6.57111 4.79932 6.57111H3.29952V5.14277C3.29952 4.99127 3.23631 4.84589 3.12381 4.73873C3.01131 4.63161 2.85872 4.57142 2.69961 4.57142C2.5405 4.57142 2.38792 4.63161 2.27541 4.73873C2.1629 4.84589 2.0997 4.99127 2.0997 5.14277V6.57111H0.599913C0.440804 6.57111 0.288218 6.6313 0.175709 6.73842C0.0632045 6.84559 0 6.99096 0 7.14246C0 7.29397 0.0632045 7.4393 0.175709 7.54646C0.288218 7.65358 0.440804 7.71377 0.599913 7.71377H2.0997V9.14215C2.0997 9.29366 2.1629 9.43899 2.27541 9.54615C2.38792 9.65327 2.5405 9.71346 2.69961 9.71346C2.85872 9.71346 3.01131 9.65327 3.12381 9.54615C3.23631 9.43899 3.29952 9.29366 3.29952 9.14215Z"
        fill="#B1CDC1"
      />
    </Svg>
  );
}

function CreateGroupIcon() {
  return (
    <Svg width={41} height={20} viewBox="0 0 41 20" fill="none">
      <Path
        d="M19.9995 8.52928C22.0299 8.52928 23.8237 6.75397 23.9995 4.5715C24.0868 3.47508 23.7164 2.4526 22.9564 1.69296C22.2045 0.942618 21.1534 0.529411 19.9995 0.529411C18.8365 0.529411 17.7845 0.940119 17.038 1.68582C16.283 2.43974 15.9149 3.46438 15.9995 4.57077C16.1722 6.75359 17.9657 8.52928 19.9995 8.52928Z"
        fill="#B1CDC1"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 16.5293H13.2308C13.0536 16.5315 12.8781 16.4969 12.7171 16.4281C12.5562 16.3592 12.4138 16.2579 12.3004 16.1314C12.0504 15.854 11.9496 15.475 12.0239 15.0918C12.3485 13.4197 13.3619 12.0151 14.9542 11.0294C16.3685 10.1544 18.1604 9.67225 20 9.67225C21.8396 9.67225 23.6315 10.1544 25.0457 11.0297C25.2028 11.127 25.3543 11.2283 25.5 11.3336C23 12.5294 22 14.0294 21 16.5293Z"
        fill="#B1CDC1"
      />
      <Path
        d="M6.11113 13.5295V11.0294H8.88894C9.18358 11.0294 9.46621 10.924 9.67462 10.7366C9.88294 10.549 10 10.0294 10 10.0294C10 9.76427 9.88294 9.50983 9.67462 9.32227C9.46621 9.13477 9.18358 9.02942 8.88894 9.02942H6.11113V6.52943C6.11113 6.26426 5.99404 6.00982 5.78569 5.82226C5.57732 5.63476 5.29471 5.52941 5.00001 5.52941C4.70532 5.52941 4.42272 5.63476 4.21434 5.82226C4.00596 6.00982 3.8889 6.26426 3.8889 6.52943V9.02942H1.11111C0.816423 9.02942 0.533816 9.13477 0.325436 9.32227C0.117063 9.50983 0 9.76427 0 10.0294C0 10.2946 0.117063 10.549 0.325436 10.7366C0.533816 10.924 0.816423 11.0294 1.11111 11.0294H3.8889V13.5295C3.8889 13.7946 4.00596 14.049 4.21434 14.2366C4.42272 14.4241 4.70532 14.5294 5.00001 14.5294C5.29471 14.5294 5.57732 14.4241 5.78569 14.2366C5.99404 14.049 6.11113 13.7946 6.11113 13.5295Z"
        fill="#B1CDC1"
      />
      <Path
        d="M31.3594 9.52926C33.7349 9.52926 35.8338 7.41455 36.0394 4.81484C36.1415 3.50881 35.7082 2.29085 34.819 1.386C33.9393 0.492202 32.7094 0 31.3594 0C29.9986 0 28.7679 0.489225 27.8944 1.37749C27.0111 2.27554 26.5804 3.49606 26.6795 4.81398C26.8815 7.41409 28.9798 9.52926 31.3594 9.52926Z"
        fill="#B1CDC1"
      />
      <Path
        d="M40.692 17.3468C40.3122 15.355 39.1265 13.6819 37.2635 12.5077C35.6089 11.465 33.5123 10.8907 31.36 10.8907C29.2076 10.8907 27.1111 11.465 25.4565 12.5073C23.5935 13.6814 22.4077 15.3546 22.0279 17.3464C21.9411 17.8029 22.059 18.2542 22.3515 18.5848C22.4841 18.7354 22.6507 18.8561 22.8391 18.9381C23.0274 19.0201 23.2327 19.0613 23.4401 19.0587H39.28C39.4874 19.0615 39.6929 19.0204 39.8813 18.9385C40.0698 18.8566 40.2366 18.7359 40.3694 18.5852C40.661 18.2546 40.7789 17.8033 40.692 17.3468Z"
        fill="#B1CDC1"
      />
    </Svg>
  );
}



export default function GroupsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const {
    groups,
    fetchGroups,
    removeMemberFromGroup,
    deleteGroup,
    updateGroup,
    createGroup,
    addMemberToGroup,
    promoteMemberToAdmin,
    demoteMemberFromAdmin,
    fetchGroupDetails,
    isLoading,
    error
  } = useAppStore();
  const { friends, fetchFriends, friendRequests, fetchFriendRequests, setAddFriendVisible, setRequestsVisible } = useFriendStore();
  const { user } = useAuthStore();

  // Switch state
  const [viewMode, setViewMode] = useState<'groups' | 'friends'>('groups');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Options Sheet / Modal State
  const [activeGroupItem, setActiveGroupItem] = useState<Group | null>(null);
  const [activeFriendItem, setActiveFriendItem] = useState<User | null>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Edit Group Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupIcon, setEditGroupIcon] = useState('👥');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Create Group Modal State
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] = useState(false);

  // Load data
  useEffect(() => {
    fetchGroups();
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const hasRequests = friendRequests.length > 0;

  const isGroupAdmin = (group: Group) => {
    if (!user) return false;
    const member = group.members.find((m) => m.userId === user.id);
    return member?.role === 'admin';
  };

  const handleGroupLongPress = (event: any, group: Group) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setActiveGroupItem(group);
    setActiveFriendItem(null);
    setIsOptionsModalVisible(true);
  };

  const handleFriendLongPress = (event: any, friend: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setActiveFriendItem(friend);
    setActiveGroupItem(null);
    setIsOptionsModalVisible(true);
  };

  const handleLeaveGroupAction = () => {
    if (!activeGroupItem || !user) return;
    setIsOptionsModalVisible(false);

    const willDeleteGroup = activeGroupItem.members.length <= 2;

    if (willDeleteGroup) {
      Alert.alert(
        'Leave & Delete Group',
        `Leaving this group will leave only 1 person in it, which will delete the group "${activeGroupItem.name}". Are you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave and Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteGroup(activeGroupItem.id);
              if (success) {
                Alert.alert('Success', 'You left the group, and it was deleted because it had too few members.');
                setActiveGroupItem(null);
                fetchGroups();
              } else {
                Alert.alert('Error', error || 'Failed to delete group.');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Leave Group',
        `Are you sure you want to leave "${activeGroupItem.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              const success = await removeMemberFromGroup(activeGroupItem.id, user.id);
              if (success) {
                Alert.alert('Success', 'You have left the group.');
                fetchGroups();
              } else {
                Alert.alert('Error', error || 'Failed to leave group.');
              }
            },
          },
        ]
      );
    }
  };

  const handleEditGroupAction = async () => {
    if (!activeGroupItem) return;
    setIsOptionsModalVisible(false);
    
    // Fetch latest group details (including members)
    const detailedGroup = await fetchGroupDetails(activeGroupItem.id);
    if (detailedGroup) {
      setActiveGroupItem(detailedGroup);
      setEditGroupName(detailedGroup.name);
      setEditGroupIcon(detailedGroup.icon || '👥');
    } else {
      setEditGroupName(activeGroupItem.name);
      setEditGroupIcon(activeGroupItem.icon || '👥');
    }
    
    setIsEditModalVisible(true);
  };

  const handleSaveGroupEdit = async () => {
    if (!activeGroupItem) return;
    if (!editGroupName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the group.');
      return;
    }
    const success = await updateGroup(activeGroupItem.id, editGroupName.trim(), editGroupIcon);
    if (success) {
      Alert.alert('Success', 'Group updated successfully.');
      setIsEditModalVisible(false);
      setActiveGroupItem(null);
      fetchGroups();
    } else {
      Alert.alert('Error', error || 'Failed to update group.');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!activeGroupItem) return;
    
    const willDeleteGroup = activeGroupItem.members.length <= 2;

    if (willDeleteGroup) {
      Alert.alert(
        'Delete Group',
        `Removing this member will leave only 1 person in the group. This will delete the group "${activeGroupItem.name}". Are you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Group',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteGroup(activeGroupItem.id);
              if (success) {
                Alert.alert('Success', 'The group was deleted because it had too few members.');
                setIsEditModalVisible(false);
                setIsAddingMember(false);
                setActiveGroupItem(null);
                fetchGroups();
              } else {
                Alert.alert('Error', error || 'Failed to delete group.');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Remove Member',
        'Are you sure you want to remove this member from the group?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const success = await removeMemberFromGroup(activeGroupItem.id, memberUserId);
              if (success) {
                const updatedGroup = await fetchGroupDetails(activeGroupItem.id);
                if (updatedGroup) {
                  setActiveGroupItem(updatedGroup);
                }
                fetchGroups();
              } else {
                Alert.alert('Error', error || 'Failed to remove member.');
              }
            }
          }
        ]
      );
    }
  };

  const handleToggleAdmin = async (memberUserId: string, currentRole: 'admin' | 'member') => {
    if (!activeGroupItem) return;
    
    let success = false;
    if (currentRole === 'admin') {
      success = await demoteMemberFromAdmin(activeGroupItem.id, memberUserId);
    } else {
      success = await promoteMemberToAdmin(activeGroupItem.id, memberUserId);
    }
    
    if (success) {
      const updatedGroup = await fetchGroupDetails(activeGroupItem.id);
      if (updatedGroup) {
        setActiveGroupItem(updatedGroup);
      }
      fetchGroups();
    } else {
      Alert.alert('Error', error || 'Failed to update member role.');
    }
  };

  const handleAddMemberToGroupInline = async (userId: string) => {
    if (!activeGroupItem) return;
    
    const success = await addMemberToGroup(activeGroupItem.id, userId);
    if (success) {
      const updatedGroup = await fetchGroupDetails(activeGroupItem.id);
      if (updatedGroup) {
        setActiveGroupItem(updatedGroup);
      }
      fetchGroups();
    } else {
      Alert.alert('Error', error || 'Failed to add member to group.');
    }
  };

  const handleCreateGroup = async (name: string, icon: string, selectedFriendIds: string[]) => {
    try {
      const newGroup = await createGroup(name, icon);
      if (newGroup) {
        // Add selected friends
        for (const friendId of selectedFriendIds) {
          await addMemberToGroup(newGroup.id, friendId);
        }
        Alert.alert('Success', 'Group created successfully!');
        fetchGroups();
        return true;
      } else {
        Alert.alert('Error', error || 'Failed to create group.');
        return false;
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create group.');
      return false;
    }
  };

  const handleDeleteGroupAction = () => {
    if (!activeGroupItem) return;
    setIsOptionsModalVisible(false);
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${activeGroupItem.name}"? This will delete all expenses and splits and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGroup(activeGroupItem.id);
            if (success) {
              Alert.alert('Success', 'Group deleted successfully.');
              fetchGroups();
            } else {
              Alert.alert('Error', error || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFriendAction = () => {
    if (!activeFriendItem) return;
    setIsOptionsModalVisible(false);
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${activeFriendItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await useFriendStore.getState().removeFriend(activeFriendItem.id);
            if (success) {
              Alert.alert('Success', 'Friend removed successfully.');
              fetchFriends();
            } else {
              Alert.alert('Error', 'Failed to remove friend.');
            }
          },
        },
      ]
    );
  };

  const friendsNotInGroup = friends.filter(friend => 
    activeGroupItem && !activeGroupItem.members.some(member => member.userId === friend.id)
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Replaces top header with custom view toggle */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.headerTitleRow}
          onPress={() => setIsDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.headerTitleText}>{viewMode === 'groups' ? 'Groups' : 'Friends'}</Text>
          <View style={styles.arrowCircle}>
            <ArrowIcon />
          </View>
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            onPress={() => setRequestsVisible(true)}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            {hasRequests ? <ActiveHeart /> : <InactiveHeart />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (viewMode === 'groups') {
                setIsCreateGroupModalVisible(true);
              } else {
                setAddFriendVisible(true);
              }
            }}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            {viewMode === 'groups' ? <CreateGroupIcon /> : <AddFriendIcon />}
          </TouchableOpacity>
        </View>
      </View>

      <ScreenWrapper hideHeader={true}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: 90 },
            (viewMode === 'groups' ? groups.length === 0 : friends.length === 0) && { flexGrow: 1, justifyContent: 'center', paddingBottom: 90 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'groups' ? (
            // Groups List
            groups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}> A bit quiet in here...</Text>
                <Text style={styles.emptySubtext}>
                  No groups yet? Time to gather your squad (and make sure they actually pay you back).
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={() => setIsCreateGroupModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyStateBtnText}>Create Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groups.map((group) => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  currentUserId={user?.id || ''}
                  onPress={() => (navigation as any).navigate('GroupDetail', { groupId: group.id })}
                  onLongPress={(e) => handleGroupLongPress(e, group)}
                />
              ))
            )
          ) : (
            // Friends List
            friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Lonelier than a single dollar bill...</Text>
                <Text style={styles.emptySubtext}>
                  Splitting bills is way better when you have friends. Add some people to start sharing the damage!
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={() => setAddFriendVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyStateBtnText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            ) : (
              friends.map((friend) => (
                <FriendListItem
                  key={friend.id}
                  friend={friend}
                  groups={groups}
                  currentUserId={user?.id || ''}
                  onLongPress={(e) => handleFriendLongPress(e, friend)}
                />
              ))
            )
          )}
        </ScrollView>
      </ScreenWrapper>

      <AddExpenseFloatingButton />

      {/* Dropdown Menu Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDropdownVisible(false)}>
          <View style={styles.dropdownOverlayBg} />
        </Pressable>
        <View style={[styles.dropdownContainer, { top: insets.top + 16 }]}>
          <TouchableOpacity
            style={[styles.dropdownItem, viewMode === 'groups' && styles.dropdownItemActive]}
            onPress={() => {
              setViewMode('groups');
              setIsDropdownVisible(false);
            }}
          >
            <Text style={[styles.dropdownItemText, viewMode === 'groups' && styles.dropdownItemTextActive]}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, viewMode === 'friends' && styles.dropdownItemActive]}
            onPress={() => {
              setViewMode('friends');
              setIsDropdownVisible(false);
            }}
          >
            <Text style={[styles.dropdownItemText, viewMode === 'friends' && styles.dropdownItemTextActive]}>Friends</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Context Menu Modal for Long Press */}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOptionsModalVisible(false)}>
          <View style={styles.dropdownOverlayBg} />
        </Pressable>
        <View
          style={[
            styles.contextMenuContainer,
            {
              top: Math.max(
                insets.top + 60,
                Math.min(
                  menuPosition.y - 10,
                  screenHeight - (activeGroupItem ? (isGroupAdmin(activeGroupItem) ? 170 : 60) : 60) - 100
                )
              ),
              right: 24,
            },
          ]}
        >
          {activeGroupItem && (
            <View style={styles.contextMenuList}>
              {isGroupAdmin(activeGroupItem) && (
                <TouchableOpacity style={styles.contextOptionBtn} onPress={handleEditGroupAction}>
                  <EditIcon />
                  <Text style={styles.contextOptionText}>Edit Group</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.contextOptionBtn} onPress={handleLeaveGroupAction}>
                <LeaveIcon />
                <Text style={[styles.contextOptionText, styles.dangerText]}>Leave Group</Text>
              </TouchableOpacity>

              {isGroupAdmin(activeGroupItem) && (
                <TouchableOpacity style={styles.contextOptionBtn} onPress={handleDeleteGroupAction}>
                  <DeleteIcon />
                  <Text style={[styles.contextOptionText, styles.dangerText]}>Delete Group</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeFriendItem && (
            <View style={styles.contextMenuList}>
              <TouchableOpacity style={styles.contextOptionBtn} onPress={handleRemoveFriendAction}>
                <RemoveFriendIcon />
                <Text style={[styles.contextOptionText, styles.dangerText]}>Remove Friend</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsEditModalVisible(false);
          setIsAddingMember(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Group</Text>
            
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Group Name input */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.emojiLabel}>Group Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGroupName}
                  onChangeText={setEditGroupName}
                  placeholder="Group Name"
                  placeholderTextColor="#5A7268"
                />
              </View>

              {/* Group Icon input */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.emojiLabel}>Group Icon Emoji</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGroupIcon}
                  onChangeText={setEditGroupIcon}
                  placeholder="e.g. 👥"
                  placeholderTextColor="#5A7268"
                  maxLength={4}
                />
              </View>

              {/* Members List Section */}
              <View style={styles.membersSection}>
                <Text style={styles.sectionTitle}>Group Members</Text>
                {activeGroupItem?.members?.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.user?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.memberTextContainer}>
                        <Text style={styles.memberName}>{member.user?.name}</Text>
                        <View style={[
                          styles.roleBadge,
                          member.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeMember
                        ]}>
                          <Text style={[
                            styles.roleBadgeText,
                            member.role === 'admin' ? styles.roleBadgeTextAdmin : styles.roleBadgeTextMember
                          ]}>
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {member.userId !== user?.id && (
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={[styles.roleActionBtn, member.role === 'admin' && styles.roleActionBtnActive]}
                          onPress={() => handleToggleAdmin(member.userId, member.role)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.roleActionBtnText}>
                            {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.memberRemoveBtn}
                          onPress={() => handleRemoveMember(member.userId)}
                          activeOpacity={0.7}
                        >
                          <DeleteIcon color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Add Member Section */}
              <View style={styles.addMemberSection}>
                <View style={styles.addMemberHeader}>
                  <Text style={styles.sectionTitle}>Add Member</Text>
                  <TouchableOpacity 
                    onPress={() => setIsAddingMember(!isAddingMember)}
                    style={styles.toggleAddBtn}
                  >
                    <Text style={styles.toggleAddBtnText}>
                      {isAddingMember ? 'Hide' : 'Show Friends'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isAddingMember && (
                  <View style={styles.friendsListContainer}>
                    {friendsNotInGroup.length === 0 ? (
                      <View style={styles.emptyFriendsContainer}>
                        <Text style={styles.emptyFriendsText}>
                          All your friends are in the group.
                        </Text>
                      </View>
                    ) : (
                      friendsNotInGroup.map((friend) => (
                        <View key={friend.id} style={styles.friendRow}>
                          <View style={styles.friendInfo}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {friend.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.friendTextContainer}>
                              <Text style={styles.friendName}>{friend.name}</Text>
                              <Text style={styles.friendEmail}>{friend.email}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.addFriendBtn}
                            onPress={() => handleAddMemberToGroupInline(friend.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.addFriendBtnText}>Add</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                    
                    <TouchableOpacity
                      style={styles.inviteFriendBtn}
                      onPress={() => {
                        setIsEditModalVisible(false);
                        setIsAddingMember(false);
                        setAddFriendVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.inviteFriendBtnText}>Invite friend by email</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={handleSaveGroupEdit}
              >
                <Text style={styles.modalSubmitBtnText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setIsAddingMember(false);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={isCreateGroupModalVisible}
        onClose={() => setIsCreateGroupModalVisible(false)}
        friends={friends}
        onCreateGroup={handleCreateGroup}
        onAddFriendClick={() => {
          setIsCreateGroupModalVisible(false);
          setAddFriendVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: 3 }],
  },
  headerTitleText: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 34,
    color: '#DBE8E3',
    textTransform: 'none',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    color: '#DBE8E3',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySubtext: {
    color: '#8E9A9D',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyStateBtn: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateBtnText: {
    color: '#060D10',
    fontWeight: '700',
    fontSize: 15,
  },





  // Selector Dropdown Modal layout
  dropdownOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.4)',
  },
  dropdownContainer: {
    position: 'absolute',
    left:24,
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    padding: 6,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
  },
  dropdownItemText: {
    fontFamily:"PlayfairDisplay-Italic",
    color: '#5A7268',
    fontSize: 24,
  },
  dropdownItemTextActive: {
    color: '#00EE87',
  },

  // Context Menu layout
  contextMenuContainer: {
    position: 'absolute',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  contextMenuList: {
    gap: 4,
  },
  contextOptionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contextOptionText: {
    color: '#DBE8E3',
    fontSize: 17,
    fontWeight: '600',
  },
  dangerText: {
    color: '#FF3B30',
  },

  // Modal styling (Edit group)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 32,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#0D242E',
    paddingHorizontal: 16,
    color: '#DBE8E3',
    fontSize: 15,
  },
  emojiLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSubmitBtnText: {
    color: '#060D10',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  modalScrollView: {
    maxHeight: 320,
    marginVertical: 12,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  membersSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#12252F',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C292E',
  },
  memberAvatarText: {
    color: '#00EE87',
    fontSize: 14,
    fontWeight: '700',
  },
  memberTextContainer: {
    gap: 2,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DBE8E3',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(0, 238, 135, 0.1)',
    borderColor: 'rgba(0, 238, 135, 0.2)',
  },
  roleBadgeMember: {
    backgroundColor: 'rgba(142, 154, 157, 0.1)',
    borderColor: 'rgba(142, 154, 157, 0.2)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleBadgeTextAdmin: {
    color: '#00EE87',
  },
  roleBadgeTextMember: {
    color: '#8E9A9D',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    borderWidth: 1,
    borderColor: '#1C292E',
  },
  roleActionBtnActive: {
    borderColor: 'rgba(0, 238, 135, 0.3)',
  },
  roleActionBtnText: {
    color: '#B1CDC1',
    fontSize: 12,
    fontWeight: '600',
  },
  memberRemoveBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemberSection: {
    marginTop: 16,
  },
  addMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleAddBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleAddBtnText: {
    color: '#00EE87',
    fontSize: 13,
    fontWeight: '600',
  },
  friendsListContainer: {
    gap: 10,
    backgroundColor: 'rgba(6, 13, 16, 0.3)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C292E',
  },
  emptyFriendsContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyFriendsText: {
    color: '#8E9A9D',
    fontSize: 13,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  friendTextContainer: {
    gap: 2,
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DBE8E3',
  },
  friendEmail: {
    fontSize: 12,
    color: '#8E9A9D',
  },
  addFriendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#00EE87',
  },
  addFriendBtnText: {
    color: '#060D10',
    fontSize: 12,
    fontWeight: '700',
  },
  inviteFriendBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  inviteFriendBtnText: {
    color: '#00EE87',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
