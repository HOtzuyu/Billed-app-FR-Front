/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  screen,
  waitFor,
  getByTestId
} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import {
  bills
} from "../fixtures/bills.js";
import {
  ROUTES_PATH
} from "../constants/routes.js";
import {
  localStorageMock
} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills";

import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js";
import {
  get
} from "express/lib/response";
import NewBill from "../containers/NewBill.js";

// test sur la page employée des factures
describe("Given I am connected as an employee", () => {
  //Étant donné que je suis connecté en tant qu'employé
  describe("When I am on Bills Page", () => {
    //Quand je suis sur la page Bills(factures)
    test("Then bill icon in vertical layout should be highlighted", async () => {
      //Ensuite, l'icône de la facture dans la disposition verticale doit être mise en surbrillance
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      /**
       * Ajout de la mention expect
       */
      expect(windowIcon.className).toContain("active-icon"); //check si dans les class y a active-icon
    });

    test("Then bills should be ordered from earliest to latest", () => {
      //ensuite les notes doivent être en ordre croissant
      document.body.innerHTML = BillsUI({
        data: bills
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  /**************************************************************************/
  //test navigation ligne 19 containers/Bills.js
  describe("When I click on button 'Nouvelle note de frais' ", () => {
    //Quand je click sur le bouton 'Nouvelle note de frais'
    test("Then, it should render NewBill page ", () => {
      //Ensuite, il devrait rendre la page NewBill
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }));
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;
      //J'intègre le chemin d'accès
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const btn = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
      btn.addEventListener("click", handleClickNewBill);
      userEvent.click(btn);
      //je m'attends à ce que la page nouvelle note de frais se charge
      expect(handleClickNewBill).toHaveBeenCalled();
    });
  });

  //test handleClickIconEye ligne 23 containers/Bills.js
  describe("When I click on button 'IconEye' ", () => {
    //Lorsque je clique sur l'icône œil
    test("Then modal should open ", () => {
      //Ensuite, la modale devrait s'ouvrir
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      //simule des données dans le localstorage
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }));
      //on simule en utilisateur connécter de type employé
      const html = BillsUI({
        data: bills
      });
      //création de la constante la modale facture de l'employé
      document.body.innerHTML = html;
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      //creation d'une facture

      //MOCK de la modale
      $.fn.modal = jest.fn();
      //affichage de la modale
      const iconEye = screen.getAllByTestId("icon-eye")[0];

      //fonction qui simule un click
      const handleShowModalFile = jest.fn((e) => {
        billsContainer.handleClickIconEye(e.target);
      });
      iconEye.addEventListener("click", handleShowModalFile);
      userEvent.click(iconEye);

      //vérifie si l'evenement au click a été appeler
      expect(handleShowModalFile).toHaveBeenCalled();
      //vérifie si true ou false
      expect(screen.getAllByText("Justificatif")).toBeTruthy();
    });
  });

  describe("Get data", () => {
    test("Then get data", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a"
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    /**************************************************************************/


    /**
     * test d'integration get bill
     */
    describe("When I get bills", () => {
      test("Then it should render bills", async () => {
        const bills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const getBills = jest.fn(() => bills.getBills());
        const value = await getBills();
        expect(getBills).toHaveBeenCalled();
        expect(value.length).toBe(4);
      });
    });

    /**
     * TEST ERREUR 404 ET 500
     */
    test("Then it should display a 404 error message", async () => {
      mockStore.bills = jest.fn().mockImplementation(() => {
        Promise.reject(new Error("Erreur 404"));
      });
      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Then it should display a 500 error message", async () => {
      mockStore.bills = jest.fn().mockImplementation(() => {
        Promise.reject(new Error("Erreur 500"));
      });
      const html = BillsUI({
        error: "Erreur 500"
      });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});