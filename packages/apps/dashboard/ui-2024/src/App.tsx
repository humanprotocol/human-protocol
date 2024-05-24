import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@pages/Home';
import Graph from '@pages/Graph';
import RoleDetails from '@pages/RoleDetails';

const App: React.FC = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/details/:id" element={<RoleDetails />} />
				<Route path="/graph" element={<Graph />} />
				<Route path="/search/:id" element={<div>Search</div>} />
				<Route path="*" element={<div>Not find</div>} />
			</Routes>
		</Router>
	);
};

export default App;
