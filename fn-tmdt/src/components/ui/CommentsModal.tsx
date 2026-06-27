import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Badge } from './Badge';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_PRODUCT_COMMENTS, ADD_COMMENT_MUTATION } from '../../graphql/comment';
import { useUserProfile } from '../../contexts/UserProfileContext';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, productId }) => {
  const { profile } = useUserProfile();
  const [newComment, setNewComment] = useState('');
  
  const { data, loading, refetch } = useQuery(GET_PRODUCT_COMMENTS, {
    variables: { productId, page: 1, limit: 50 },
    skip: !isOpen || !productId,
    fetchPolicy: 'cache-and-network'
  });
  
  const [addCommentMutate, { loading: addLoading }] = useMutation(ADD_COMMENT_MUTATION, {
    onCompleted: () => {
      setNewComment('');
      refetch();
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim() || !productId) return;
    addCommentMutate({ variables: { productId, content: newComment } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (!isOpen) return null;

  const comments = (data as any)?.productComments?.items || [];
  const totalComments = (data as any)?.productComments?.totalItems || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lớp nền tối mờ */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Thân Modal */}
      <div className="relative bg-[#FBFBFE] text-[#040316] w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight font-headline">Thảo luận</h2>
            <Badge variant="secondary">{totalComments} Bình luận</Badge>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-bright rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-tertiary" /></div>
          ) : comments.length === 0 ? (
             <div className="text-center text-sm text-on-surface-variant/50 py-10">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
          ) : (
            <div className="space-y-4">
              {comments.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl hover:bg-surface-container-low transition-colors flex gap-4">
                  <img 
                    src={c.user.avatarUrl || "https://ui-avatars.com/api/?name=" + c.user.fullName} 
                    alt={c.user.fullName} 
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.user.fullName}</span>
                      <span className="text-xs text-on-surface-variant/60 ml-auto">
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thanh nhập bình luận dưới cùng */}
        {profile?.id ? (
          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high shrink-0">
              <img
                alt="Hồ sơ người dùng"
                className="w-full h-full object-cover"
                src={(profile as any).avatar || (profile as any).avatarUrl || "https://ui-avatars.com/api/?name=" + (profile as any).name}
              />
            </div>
            <div className="flex-1 relative flex items-center bg-white rounded-2xl border border-outline-variant/20 px-4 py-2.5 focus-within:border-tertiary transition-colors">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={addLoading}
                placeholder="Viết phản hồi tới nghệ sĩ và cộng đồng..."
                className="w-full bg-transparent border-none outline-none text-sm focus:ring-0 placeholder:text-on-surface-variant/40 text-on-surface pr-16"
              />
            </div>
            <button 
              onClick={handleAddComment}
              disabled={addLoading || !newComment.trim()}
              className="px-6 py-2.5 bg-[#F65C88] hover:bg-[#F65C88]/90 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold shadow-md shrink-0 transition-colors"
            >
              {addLoading ? <Loader2 size={16} className="animate-spin" /> : 'Gửi phản hồi'}
            </button>
          </div>
        ) : (
          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 text-center text-sm text-on-surface-variant/60">
            Vui lòng đăng nhập để bình luận.
          </div>
        )}

      </div>
    </div>
  );
};
