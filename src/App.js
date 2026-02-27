import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader } from './components/loaders';
// Import the dashboard from users.js
import { MemberADashboard } from './components/users';

const WelcomeApp = lazy(() => import("./containers/welcome"));
const HomeApp = lazy(() => import("./containers/home"));

export default function App() {
    // Access the session state from Redux
    const session = useSelector(state => state.session);
    
    /**
     * AUTHENTICATION CHECK
     * We check for 'authToken' OR 'token' OR 'user' to be safe.
     * The !! converts the value to a clear true/false.
     */
    const isAuthenticated = !!(
        (session.authToken && session.authToken.length > 0) || 
        (session.token && session.token.length > 0) ||
        (session.user)
    );

    return (
        <Router>
            <Suspense fallback={<Loader isLoading={true} />}>
                <Switch>
                    {/* 1. PUBLIC ROUTE: Only accessible if NOT logged in */}
                    <Route exact path="/auth" render={(props) => {
                        if (isAuthenticated) {
                            return <Redirect to="/" />;
                        } else {
                            return <WelcomeApp {...props} />;
                        }
                    }} />

                    {/* 2. SPECIAL ROUTE: Patient Dashboard */}
                    <Route exact path="/patient-dashboard" render={(props) => {
                         return isAuthenticated ? 
                            <MemberADashboard {...props} /> : 
                            <Redirect to="/auth" />;
                    }} />

                    {/* 3. PRIVATE ROOT ROUTE: HomeApp or Redirect to Login */}
                    <Route path="/" render={(props) => {
                        if (!isAuthenticated) {
                            return (
                                <Redirect to="/auth" />
                            );
                        } else {
                            return (
                                <HomeApp {...props} />
                            );
                        }
                    }} />
                </Switch>
            </Suspense>
        </Router>
    );
}