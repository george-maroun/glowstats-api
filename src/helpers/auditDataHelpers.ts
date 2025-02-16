
function getWeeksSinceStart() {
  const genesisTimeInSeconds = 1700352000;
  const start = new Date(genesisTimeInSeconds * 1000);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return weeks;
};

// Function to calculate the week number for a given date
const getWeekFromDate = (date: Date): number => {
  const genesisTimeInSeconds = 1700352000;
  const genesisDate = new Date(genesisTimeInSeconds * 1000);
  const timeDifference = date.getTime() - genesisDate.getTime();
  const weekNumber = Math.floor(timeDifference / (7 * 24 * 60 * 60 * 1000));
  return weekNumber;
};


const fetchData = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch data from ${url}:`, error);
    throw error; // Re-throw to handle it in the calling function
  }
}

export default fetchData;

export const fetchAuditData = async (): Promise<any[]> => {
  const auditData = await fetchData('https://glow.org/api/audits');
  return auditData;
}

// auditDate:"October 2nd, 2024"

const parseAuditDate = (dateStr: string): Date => {
  // First try to handle "3 of April 2024" format
  const ofPattern = /(\d+)\s+of\s+(\w+)\s+(\d{4})/;
  const ofMatch = dateStr.match(ofPattern);
  
  if (ofMatch) {
    const [_, day, month, year] = ofMatch;
    return new Date(`${month} ${day}, ${year}`);
  }
  
  // Handle "October 2nd, 2024" format
  const cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
  return new Date(cleanDateStr);
};

export const getNewFarmsWeekly = async (): Promise<any[]> => {
  // Get current week number
  const currentWeek = getWeeksSinceStart();

  // Group farms by week
  const farmsByWeek = new Map<number, Array<{
    farmName: string;
    farmId: string;
    auditDate: string;
    panelQuantity: number;
  }>>();

  // Initialize map with all weeks from 0 to current week
  for (let week = 0; week <= currentWeek; week++) {
    farmsByWeek.set(week, []);
  }

  const auditData = await fetchAuditData();

  auditData.forEach(farm => {
    const date = parseAuditDate(farm.auditDate);
    const week = getWeekFromDate(date);
    
    // Only add farms if their week is within our range
    if (week <= currentWeek) {
      farmsByWeek.get(week)?.push({
        farmName: farm.farmName,
        farmId: farm.id,
        auditDate: farm.auditDate,
        panelQuantity: farm.summary.solarPanels.quantity
      });
    }
  });

  // Convert Map to array of NewFarms objects
  return Array.from(farmsByWeek.entries())
    .map(([week, farms]) => ({
      week,
      newFarms: farms
    }))
    .sort((a, b) => a.week - b.week);
};


export const calculateFarmCountWeekly = (newFarmsWeekly: any[]) => {
  let acc = 0;
  return newFarmsWeekly.map(weeklyData => {
    acc += weeklyData.newFarms.length;
    return {
      week: weeklyData.week,
      value: acc
    }
  });
};

// export const calculatePanelCountWeekly = (newFarmsWeekly: any[]) => {
//   let acc = 0;
//   return newFarmsWeekly.map(weeklyData => {
//     acc += weeklyData.newFarms.reduce((acc, curr) => acc + curr.panelQuantity, 0);
//     return {
//       week: weeklyData.week,
//       value: acc
//     }
//   });
// };

