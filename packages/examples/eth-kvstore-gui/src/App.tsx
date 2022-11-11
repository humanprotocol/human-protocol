import Appbar from "./components/Appbar";
import PleaseConnect from "./components/PleaseConnect";
import Tab from "./components/Tab";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  return (
    <>
      <Appbar />
      {!isConnected && <PleaseConnect />}
      {isConnected && <Tab />}
    </>
  );
}
