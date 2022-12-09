/**
 * @jest-environment jsdom
 */


import "@testing-library/jest-dom";
import {
  screen,
  waitFor,
  getByTestId,
  fireEvent
} from "@testing-library/dom";

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import {
  localStorageMock
} from "../__mocks__/localStorage.js";
import {
  ROUTES_PATH
} from "../constants/routes.js";
import {
  bills
} from "../fixtures/bills";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import {
  handle
} from "express/lib/application";
import mockStore from "../__mocks__/store.js";

//gestion page employée
describe("Given I am connected as an employee", () => {
  //Étant donné que je suis connecté en tant qu'employé
  describe("When I am on NewBill Page", () => {
    //Quand je suis sur la page NewBill

    //test affichage barre verticale 
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.className).toContain("active-icon");
    });

    //Test des champs
    test("Then I show the form ", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });

    //Validation du formulaire
    describe("When I submit the form  ", () => {

      // test d'entrée du bon fichier
      test("Then I upload a file in right format    ", () => {
        window.alert = jest.fn()

        const html = NewBillUI();
        document.body.innerHTML = html;

        mockStore.bills = jest.fn().mockImplementation(() => {
          return {
            create: () => {
              return Promise.resolve({});
            },
          };
        });

        const onNavigate = (pathname) => {
          document.body.innerHTML = pathname;
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          bills,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        fireEvent.change(inputFile, {
          target: {
            files: [new File(["file.jpg"], "file.jpg", {
              type: "file/jpg"
            })],
          },
        });

        jest.spyOn(window, 'alert');

        expect(inputFile).toBeTruthy();
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
      });

      // test d'entrée du mauvais fichier
      test("Then I upload a file in wrong format ", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        mockStore.bills = jest.fn().mockImplementation(() => {
          return {
            create: () => {
              return Promise.resolve({});
            },
          };
        });

        const onNavigate = (pathname) => {
          document.body.innerHTML = pathname;
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          bills,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        fireEvent.change(inputFile, {
          target: {
            files: [new File(["file.pdf"], "file.pdf", {
              type: "file/pdf"
            })],
          },
        });
        jest.spyOn(window, 'alert').mockImplementation(() => {});

        expect(inputFile).toBeTruthy();
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });
    });

    //SIMULATION DE CREATION DE LA PAGE DE FACTURE
    test("Then the new bill is created  ", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          create: () => {
            return Promise.resolve({});
          },
        };
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const bill = {
        email: "a@a",
        type: "Hôtel et logement",
        name: "encore",
        amount: 400,
        date: "2004-04-04",
        vat: 80,
        pct: 20,
        commentary: "séminaire billed",
        fileUrl: "test.pgn",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        status: "pending",
      };

      // Charger les valeurs dans les champs
      screen.getByTestId("expense-name").value = bill.name;
      screen.getByTestId("datepicker").value = bill.date;
      screen.getByTestId("amount").value = bill.amount;
      screen.getByTestId("vat").value = bill.vat;
      screen.getByTestId("pct").value = bill.pct;
      screen.getByTestId("commentary").value = bill.commentary;
      newBill.fileName = bill.fileName;
      newBill.fileUrl = bill.fileUrl;

      const form = screen.getByTestId("form-new-bill");

      //SIMULATION DE  CLICK
      newBill.updateBill = jest.fn();

      //ENVOI DU FORMULAIRE
      const submitForm = jest.fn((e) => {
        newBill.handleSubmit(e);
      });

      form.addEventListener("submit", submitForm);
      fireEvent.submit(form);

      //VERIFICATION DE L ENVOI DU FORMULAIRE
      expect(submitForm).toHaveBeenCalled();
      //VERIFIE SI LE FORMULAIRE EST ENVOYER DANS LE STORE
      expect(newBill.updateBill).toHaveBeenCalled();
    });

    //test erreur 500
    //récupère l'erreur d'une API et échoue avec l'erreur 500
    test("Then the Error 500 ", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      // Soumettre le formulaire
      const form = screen.getByTestId("form-new-bill");
      newBill.updateBill = jest.fn();
      const submitForm = jest.fn((e) => {
        newBill.handleSubmit(e);
      });
      form.addEventListener("submit", submitForm);
      fireEvent.submit(form);

      // Prevent Console.error jest error
      jest.spyOn(console, "error").mockImplementation(() => {});
      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
    });
  });
});