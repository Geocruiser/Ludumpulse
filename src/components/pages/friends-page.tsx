/**
 * Friends Page Component
 * 
 * Main page for managing friends, friend requests, and shared content.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Users, 
  UserPlus, 
  Bell, 
  Share2, 
  Search, 
  Heart, 
  MessageCircle 
} from 'lucide-react'
import { FriendCard } from '@/components/friends/friend-card'
import { FriendRequestCard } from '@/components/friends/friend-request-card'
import { UserSearchCard } from '@/components/friends/user-search-card'
import { SharedContentCard } from '@/components/friends/shared-content-card'
import { FriendGamesView } from '@/components/friends/friend-games-view'

import { 
  useFriends, 
  useFriendRequests, 
  useUserSearch, 
  useSharedContent 
} from '@/hooks/use-friends'

/**
 * Main friends page component with tabs for different sections
 */
export function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [isFriendGamesDialogOpen, setIsFriendGamesDialogOpen] = useState(false)
  
  // Hooks for friends functionality
  const { friends, isLoading: friendsLoading, removeFriend } = useFriends()
  const { 
    pendingRequests, 
    sentRequests, 
    isLoading: requestsLoading, 
    acceptRequest, 
    rejectRequest, 
    cancelRequest 
  } = useFriendRequests()
  const { 
    users, 
    isLoading: searchLoading, 
    searchUsers, 
    sendFriendRequest, 
    clearSearch 
  } = useUserSearch()
  const { 
    sharedContent, 
    isLoading: sharedContentLoading, 
    markAsRead 
  } = useSharedContent()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchUsers(query)
    } else {
      clearSearch()
    }
  }

  const handleViewFriendGames = (friendId: string) => {
    setSelectedFriendId(friendId)
    setIsFriendGamesDialogOpen(true)
  }

  const handleCloseFriendGames = () => {
    setIsFriendGamesDialogOpen(false)
    setSelectedFriendId(null)
  }

  const handleViewSharedContent = (contentId: string, contentType: string) => {
    // TODO: Navigate to shared content view
    console.log('View shared content:', contentId, contentType)
  }

  const unreadSharedCount = sharedContent.filter(content => !content.read).length

  // Find the selected friend's information
  const selectedFriend = friends.find(f => f.friend_id === selectedFriendId)
  const selectedFriendName = selectedFriend?.friend?.display_name || selectedFriend?.friend?.username || selectedFriend?.friend?.email || 'Friend'

  return (
    <div className="space-y-6">

      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground">
            Connect with friends and share your gaming experiences
          </p>
        </div>
        
        <Dialog 
          open={isAddFriendDialogOpen} 
          onOpenChange={setIsAddFriendDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Find Friends</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, username, or display name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <UserSearchCard
                      key={user.id}
                      user={user}
                      onSendFriendRequest={sendFriendRequest}
                    />
                  ))
                ) : searchQuery.trim() ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Start typing to search for friends
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Friend Games Modal */}
      <Dialog 
        open={isFriendGamesDialogOpen} 
        onOpenChange={setIsFriendGamesDialogOpen}
      >
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFriendName}'s Games</DialogTitle>
          </DialogHeader>
          {selectedFriendId && (
            <FriendGamesView
              friendId={selectedFriendId}
              friendName={selectedFriendName}
              onClose={handleCloseFriendGames}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Friends</p>
                <p className="text-2xl font-bold">{friends.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Shared Content</p>
                <p className="text-2xl font-bold">{sharedContent.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold">{unreadSharedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Friends</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {friends.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Sent</span>
            {sentRequests.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {sentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="shared" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Shared</span>
            {unreadSharedCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadSharedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Friends List Tab */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>My Friends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onViewGames={handleViewFriendGames}
                      onRemoveFriend={removeFriend}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding some friends to share your gaming experiences
                  </p>
                  <Button onClick={() => setIsAddFriendDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friend Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Friend Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="received"
                      onAccept={acceptRequest}
                      onReject={rejectRequest}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    When someone sends you a friend request, it will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Sent Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="sent"
                      onCancel={cancelRequest}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
                  <p className="text-muted-foreground">
                    Friend requests you send will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared Content Tab */}
        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Shared Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sharedContentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : sharedContent.length > 0 ? (
                <div className="space-y-4">
                  {sharedContent.map((content) => (
                    <SharedContentCard
                      key={content.id}
                      sharedContent={content}
                      onMarkAsRead={markAsRead}
                      onViewContent={handleViewSharedContent}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shared content</h3>
                  <p className="text-muted-foreground">
                    Content shared by your friends will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 