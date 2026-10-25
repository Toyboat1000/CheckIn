import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { generateDemoCheckups } from "../lib/trends";
import type {
  Checkup,
  Person,
  ReportCategory,
  SavedReport,
} from "../types/data";
import { getLocalDateKey } from "../utils/date";

type StoredData = {
  people: Person[];
  checkups: Checkup[];
  selectedPersonId: string | null;
  reports?: SavedReport[];
};

type AppDataContextType = {
  people: Person[];
  checkups: Checkup[];
  selectedPersonId: string | null;
  isLoading: boolean;
  reports: SavedReport[];

  addPerson: (name: string) => void;
  selectPerson: (personId: string) => void;
  addCheckup: (category: ReportCategory, rating: number, notes: string) => void;
  loadDemoData: () => void;
  resetAllData: () => Promise<void>;

  addReport: (personId: string, text: string) => SavedReport;
  deleteReport: (reportId: string) => void;
};

const STORAGE_KEY = "wellness-checkin-data";

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedData) {
          const parsedData: StoredData = JSON.parse(savedData);

          setPeople(parsedData.people);
          setCheckups(parsedData.checkups);
          setSelectedPersonId(parsedData.selectedPersonId);
          setReports(parsedData.reports ?? []);
        }
      } catch (error) {
        console.error("Could not load saved data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const dataToSave: StoredData = {
      people,
      checkups,
      selectedPersonId,
      reports,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave)).catch(
      (error) => console.error("Could not save data:", error),
    );
  }, [people, checkups, selectedPersonId, reports, isLoading]);

  function addPerson(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    const newPerson: Person = {
      id: makeId(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    setPeople((currentPeople) => [...currentPeople, newPerson]);
    setSelectedPersonId(newPerson.id);
  }

  function selectPerson(personId: string) {
    setSelectedPersonId(personId);
  }

  function addCheckup(category: ReportCategory, rating: number, notes: string) {
    if (selectedPersonId === null) {
      alert("Please select a person first.");
      return;
    }

    const now = new Date();

    const newCheckup: Checkup = {
      id: makeId(),
      personId: selectedPersonId,
      category,
      rating,
      notes: notes.trim(),
      createdAt: now.toISOString(),
      reportDate: getLocalDateKey(now),
    };

    console.log("Saved checkup:", newCheckup);

    setCheckups((currentCheckups) => [...currentCheckups, newCheckup]);
  }

  function loadDemoData() {
    if (selectedPersonId === null) return;
    const otherPeople = checkups.filter((c) => c.personId !== selectedPersonId);
    setCheckups([...otherPeople, ...generateDemoCheckups(selectedPersonId)]);
  }

  function addReport(personId: string, text: string): SavedReport {
    const newReport: SavedReport = {
      id: makeId(),
      personId,
      text,
      createdAt: new Date().toISOString(),
    };

    setReports((currentReports) => [newReport, ...currentReports]);
    return newReport;
  }

  function deleteReport(reportId: string) {
    setReports((currentReports) =>
      currentReports.filter((report) => report.id !== reportId),
    );
  }

  async function resetAllData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);

      setPeople([]);
      setCheckups([]);
      setSelectedPersonId(null);
      setReports([]);
    } catch (error) {
      console.error("Could not delete saved data:", error);
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        people,
        checkups,
        selectedPersonId,
        isLoading,
        addPerson,
        selectPerson,
        addCheckup,
        resetAllData,
        loadDemoData,
        reports,
        addReport,
        deleteReport,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
