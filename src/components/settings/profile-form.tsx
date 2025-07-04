/**
 * src/components/settings/profile-form.tsx
 *
 * Profile form for the settings page.
 * Allows users to update their profile information.
 */
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ProfileForm() {
	const { user, updateUser } = useAuth();
	const { toast } = useToast();
	const [username, setUsername] = useState(user?.user_metadata?.username || '');
	const [loading, setLoading] = useState(false);

	const email = user?.email || '';

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const { error } = await updateUser({
			data: { username },
		});

		setLoading(false);

		if (error) {
			toast({
				title: 'Error updating profile',
				description: error.message,
				variant: 'destructive',
			});
		} else {
			toast({
				title: 'Profile updated successfully',
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>
					This is how others will see you on the site.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={handleSubmit}
				>
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							disabled
						/>
					</div>
					<Button
						type="submit"
						disabled={loading}
					>
						{loading ? 'Updating...' : 'Update Profile'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
} 