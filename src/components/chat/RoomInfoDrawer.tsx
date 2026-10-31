import React, { useState } from 'react';
import {
  X,
  Users,
  Image as ImageIcon,
  FileText,
  UserPlus,
  UserMinus,
  LogOut,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { Room, Message, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../ui/Avatar';
import { formatConversationTime, formatFileSize } from '../../utils/dateUtils';
import { addMembersToGroup, removeMemberFromGroup, leaveGroup } from '../../firebase/chatService';

interface RoomInfoDrawerProps {
  room: Room;
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onImageClick: (url: string, name: string) => void;
}

export const RoomInfoDrawer: React.FC<RoomInfoDrawerProps> = ({
  room,
  messages,
  isOpen,
  onClose,
  onImageClick,
}) => {
  const { currentUser, isConfigured, isDemoMode } = useAuth();
  const { allUsers, selectRoom } = useChat();

  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'media'>('details');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  if (!isOpen || !currentUser) return null;

  const isGroup = room.type === 'group';
  const isAdmin = isGroup && (room.adminIds?.includes(currentUser.uid) || room.createdBy === currentUser.uid);

  // For direct room, determine the other member
  const otherUserId = !isGroup
    ? room.members.find((uid) => uid !== currentUser.uid) || ''
    : '';
  const otherUser = otherUserId && room.memberDetails ? room.memberDetails[otherUserId] : null;

  const roomName = isGroup ? room.name || 'Group Chat' : otherUser?.displayName || 'Direct Chat';
  const roomPhoto = isGroup ? room.photoURL : otherUser?.photoURL;
  const description = isGroup ? room.description : 'Direct 1-on-1 private conversation.';

  // Shared media from messages
  const mediaMessages = messages.filter((m) => m.type === 'image' && m.fileUrl);
  const fileMessages = messages.filter((m) => m.type === 'file' && m.fileUrl);

  // Eligible users to add to group
  const nonMemberUsers = allUsers.filter((u) => !room.members.includes(u.uid));

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    const usersToAdd = allUsers.filter((u) => selectedToAdd.includes(u.uid));

    if (!isDemoMode && isConfigured) {
      await addMembersToGroup(room.id, usersToAdd);
    } else {
      // Demo update
      usersToAdd.forEach((u) => {
        room.members.push(u.uid);
        if (!room.memberDetails) room.memberDetails = {};
        room.memberDetails[u.uid] = {
          displayName: u.displayName,
          photoURL: u.photoURL,
          email: u.email,
          role: 'member',
        };
      });
    }

    setSelectedToAdd([]);
    setShowAddMember(false);
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    if (!isDemoMode && isConfigured) {
      await removeMemberFromGroup(room.id, memberUid);
    } else {
      room.members = room.members.filter((uid) => uid !== memberUid);
      if (room.memberDetails) delete room.memberDetails[memberUid];
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    if (!isDemoMode && isConfigured) {
      await leaveGroup(room.id, currentUser.uid);
    }
    selectRoom(null);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-[#111B21] border-l border-slate-200 dark:border-[#222D34] shadow-2xl flex flex-col transition-colors animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#222D34] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {isGroup ? 'Group Information' : 'Contact Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-[#222D34]">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        {isGroup && (
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Members ({room.members.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Media ({mediaMessages.length + fileMessages.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-[#1A242B] border border-slate-100 dark:border-slate-800">
          <Avatar
            src={roomPhoto}
            name={roomName}
            size="2xl"
            isGroup={isGroup}
            showOnlineStatus={!isGroup}
            isOnline={true}
            className="mb-3"
          />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {roomName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {description}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {formatConversationTime(room.createdAt)}</span>
          </div>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A242B] border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Encryption & Privacy
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Messages and attachments are transmitted in real time and protected under Firestore Security Rules.
              </p>
            </div>

            {isGroup && (
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Group</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Members */}
        {activeTab === 'members' && isGroup && (
          <div className="space-y-3">
            {isAdmin && (
              <div>
                {!showAddMember ? (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/80 mb-3"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New Member</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-100 dark:bg-[#1E293B] rounded-2xl mb-3 space-y-2 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Select users to invite:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {nonMemberUsers.length > 0 ? (
                        nonMemberUsers.map((u) => {
                          const isSelected = selectedToAdd.includes(u.uid);
                          return (
                            <div
                              key={u.uid}
                              onClick={() => {
                                setSelectedToAdd((prev) =>
                                  isSelected ? prev.filter((id) => id !== u.uid) : [...prev, u.uid]
                                );
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : 'hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Avatar src={u.photoURL} name={u.displayName} size="xs" />
                                <span className="font-medium truncate">{u.displayName}</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="accent-emerald-600"
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-400 p-2">All contacts are already members.</div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleAddMembers}
                        disabled={selectedToAdd.length === 0}
                        className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Add ({selectedToAdd.length})
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMember(false);
                          setSelectedToAdd([]);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {room.members.map((memberUid) => {
                const member = room.memberDetails?.[memberUid];
                const isMemberAdmin = room.adminIds?.includes(memberUid) || room.createdBy === memberUid;
                const isCurrent = memberUid === currentUser.uid;

                return (
                  <div key={memberUid} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={member?.photoURL}
                        name={member?.displayName || 'User'}
                        size="sm"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                          <span>{member?.displayName || 'Member'}</span>
                          {isCurrent && <span className="text-[10px] text-slate-400">(You)</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {member?.email || ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMemberAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}

                      {isAdmin && !isCurrent && (
                        <button
                          onClick={() => handleRemoveMember(memberUid)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Shared Media */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Photos ({mediaMessages.length})
              </span>
              {mediaMessages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map((m) => (
                    <img
                      key={m.id}
                      src={m.fileUrl}
                      alt={m.fileName || 'Media'}
                      onClick={() => onImageClick(m.fileUrl!, m.fileName || 'Photo')}
                      className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No photos shared yet</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Documents & Files ({fileMessages.length})
              </span>
              {fileMessages.length > 0 ? (
                <div className="space-y-2">
                  {fileMessages.map((m) => (
                    <a
                      key={m.id}
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={m.fileName}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{m.fileName}</div>
                        <div className="text-[10px] text-slate-400">{formatFileSize(m.fileSize)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No documents shared yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
