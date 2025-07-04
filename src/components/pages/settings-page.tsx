/**
 * src/components/pages/settings-page.tsx
 *
 * The settings page for the application.
 * Allows users to manage their profile, account, and other preferences.
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { ProfileForm } from '../settings/profile-form'
import { ThemeToggle } from '../theme-toggle'

export function SettingsPage() {
	const { signOut } = useAuth()

	const handleLogout = async () => {
		const { error } = await signOut()
		if (error) {
			console.error('Error logging out:', error)
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account settings and preferences.
				</p>
			</div>

			<ProfileForm />

			<Card>
				<CardHeader>
					<CardTitle>Appearance</CardTitle>
					<CardDescription>
						Customize the look and feel of the app.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="theme-toggle">Theme</Label>
							<p className="text-sm text-muted-foreground">
								Select the theme for the application.
							</p>
						</div>
						<ThemeToggle />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>
						Manage your account settings.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="destructive"
						onClick={handleLogout}
					>
						Log Out
					</Button>
				</CardContent>
			</Card>
		</div>
	)
} 