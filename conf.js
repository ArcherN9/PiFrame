var Configs = {
	// OneDrive application ID
	clientID: '4c913a34-373b-4cc6-8697-a1c6aae8ebf1',

	// Microsoft Graph application secret
	clientSecret: 'zrmoy328$|ssSYBVCYC84-)',
	redirectUrl: 'http://localhost:8080/api/token',
	identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    allowHttpForRedirectUrl: true, // For development only
    responseType: 'code',
    validateIssuer: false, // For development only
    responseMode: 'query',
    scope: [ 'User.Read', 'Files.Read.All']
}

//Export to module to make it available globally
module.exports = Configs; 