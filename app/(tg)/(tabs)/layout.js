import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
export default function TabsLayout({ children }) {
  return (<div className="app"><TopBar />{children}<BottomNav /></div>);
}
