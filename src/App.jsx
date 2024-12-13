import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { getSiteData } from "@/utils/getSiteData";
import { GlobalScrollbar } from "mac-scrollbar";
import useStores from "@/hooks/useStores";
import Header from "@/components/header";
import SiteStatus from "@/components/siteStatus";
import Footer from "@/components/footer";

const App = observer(() => {
  const { cache, status } = useStores();
  const [siteData, setSiteData] = useState(null);

  // 加载配置
  const apiKey = import.meta.env.VITE_API_KEY;
  const countDays = import.meta.env.VITE_COUNT_DAYS;

  // 获取站点数据
  const getSiteStatusData = () => {
    setSiteData(null);
    getSiteData(apiKey, countDays, cache, status).then((res) => {
      //console.log(res);

      // 对每个站点的 daily 数组按 date 值升序排序
      const sortedRes = res.map((site) => {
        // 使用slice()创建daily的副本以防止修改原始数据
        const sortedDaily = site.daily.slice().sort((a, b) => {
          // 将日期字符串转换为日期对象进行比较
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });

        // 返回新的站点对象，daily已排序
        return { ...site, daily: sortedDaily };
      });
      console.log(sortedRes);
      setSiteData(sortedRes);
    });
  };

  useEffect(() => {
    getSiteStatusData();
  }, [apiKey, countDays]);

  return (
    <>
      <GlobalScrollbar />
      <Header getSiteData={getSiteStatusData} />
      <script defer src="https://umami.guole.fun/script.js" data-website-id="d337c356-29f1-406f-b425-3cc7c0ddd5e5" data-domains="status.guole.fun"></script>
      <main id="main">
        <div className="container">
          <div className="all-site">
            <SiteStatus siteData={siteData} days={countDays} status={status} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
});

export default App;
