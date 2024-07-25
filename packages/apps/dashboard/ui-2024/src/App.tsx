import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@pages/Home';
import Graph from '@pages/Graph';
import SearchResults from '@pages/SearchResults';

const App: React.FC = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/graph" element={<Graph />} />
				<Route path="/search/:chainId/:address" element={<SearchResults />} />
				<Route path="*" element={<div>Not find</div>} />
			</Routes>
		</Router>
	);
};

export default App;
