import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Graph from '@pages/Graph';

const App: React.FC = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<div>Home</div>} />
				<Route path="/details/:id" element={<div>Details</div>} />
				<Route path="/graph" element={<Graph />} />
				<Route path="/search/:id" element={<div>Search</div>} />
				<Route path="*" element={<div>Not find</div>} />
			</Routes>
		</Router>
	);
};

export default App;
