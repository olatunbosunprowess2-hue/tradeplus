'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { sanitizeUrl } from '@/lib/utils';
import { Camera, User, Loader2 } from 'lucide-react';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function StepProfile({ onNext, onBack }: StepProps) {
  const { user, updateProfile } = useAuthStore();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    sanitizeUrl(user?.profile?.avatarUrl) || null
  );
  const [firstName, setFirstName] = useState(() => {
    const name = user?.firstName || '';
    return name.toLowerCase() === 'john' || name.toLowerCase() === 'doe' ? '' : name;
  });
  const [lastName, setLastName] = useState(() => {
    const name = user?.lastName || '';
    return name.toLowerCase() === 'john' || name.toLowerCase() === 'doe' ? '' : name;
  });
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('bio', bio);

      if (avatar) {
        formData.append('avatar', avatar);
      }

      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      onNext();
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Complete Your Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Tell the community a bit about yourself.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={avatarPreview.startsWith('blob:') ? avatarPreview : sanitizeUrl(avatarPreview)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors shadow-2xs">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              {avatarPreview ? 'Change Photo' : 'Upload Photo'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
              placeholder="e.g. Alex"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
              placeholder="e.g. Adebayo"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            About You / Trade Bio
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={120}
              className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition h-24 resize-none text-slate-900 bg-white placeholder:text-slate-400"
              placeholder="What do you like to trade? e.g. Tech enthusiast looking for phones & audio gear."
              required
            />
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-white/90 px-1 rounded">
              {bio.length}/120
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-md font-bold text-xs transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${
              onBack ? 'flex-1' : 'w-full'
            } bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
